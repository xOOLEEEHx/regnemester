import Foundation

final class HighscoreService {
    private let rest: SupabaseRESTClient?
    private let localStore: LocalStore

    init(rest: SupabaseRESTClient?, localStore: LocalStore) {
        self.rest = rest?.isConfigured == true ? rest : nil
        self.localStore = localStore
    }

    func loadNormalScores(
        mode: GameMode,
        level: GameLevel,
        gradeLevel: Int,
        questionCount: Int,
        limit: Int = RegnemesterConstants.normalVisibleLimit
    ) async throws -> [ScoreEntry] {
        if let rest {
            var query = baseScoreSelectQuery(limit: max(limit, RegnemesterConstants.normalVisibleLimit))
            query.append(contentsOf: [
                URLQueryItem(name: "game_type", value: "eq.normal"),
                URLQueryItem(name: "mode", value: "eq.\(mode.rawValue)"),
                URLQueryItem(name: "level", value: "eq.\(level.rawValue)"),
                URLQueryItem(name: "grade_level", value: "eq.\(gradeLevel)"),
                URLQueryItem(name: "order", value: mode.isTimeChallenge ? "score.asc" : "score.desc")
            ])
            if mode.isTimeChallenge {
                query.append(URLQueryItem(name: "question_count", value: "eq.\(questionCount)"))
            }
            return ScoreRanking.sortNormal(try await rest.fetchScores(queryItems: query), mode: mode, limit: limit)
        }

        let filtered = localStore.loadScores().filter { entry in
            entry.gameType == .normal &&
                entry.mode == mode &&
                entry.level == level &&
                entry.gradeLevel == gradeLevel &&
                (!mode.isTimeChallenge || entry.questionCount == questionCount)
        }
        return ScoreRanking.sortNormal(filtered, mode: mode, limit: limit)
    }

    func loadAllNormalAdminScores() async throws -> [ScoreEntry] {
        if let rest {
            var query = baseScoreSelectQuery(limit: 1000)
            query.append(URLQueryItem(name: "game_type", value: "eq.normal"))
            return try await rest.fetchScores(queryItems: query)
        }
        return localStore.loadScores().filter { $0.gameType == .normal }
    }

    func loadSchoolBattleScores(
        mode: GameMode,
        gradeGroup: GradeGroup,
        limit: Int = RegnemesterConstants.schoolBattleVisibleLimit
    ) async throws -> [ScoreEntry] {
        if let rest {
            var query = baseScoreSelectQuery(limit: max(limit, RegnemesterConstants.schoolBattleVisibleLimit))
            query.append(contentsOf: [
                URLQueryItem(name: "game_type", value: "eq.school_battle"),
                URLQueryItem(name: "mode", value: "eq.\(mode.rawValue)"),
                URLQueryItem(name: "order", value: mode.isTimeChallenge ? "score.asc" : "score.desc")
            ])
            if mode.isTimeChallenge {
                query.append(URLQueryItem(name: "grade_group", value: "eq.\(gradeGroup.rawValue)"))
                query.append(URLQueryItem(name: "question_count", value: "eq.\(RegnemesterConstants.schoolBattleTimeQuestionCount)"))
            }
            return ScoreRanking.sortSchoolBattle(try await rest.fetchScores(queryItems: query), mode: mode, limit: limit)
        }

        let filtered = localStore.loadScores().filter { entry in
            entry.gameType == .schoolBattle &&
                entry.mode == mode &&
                (!mode.isTimeChallenge || (entry.gradeGroup == gradeGroup && entry.questionCount == RegnemesterConstants.schoolBattleTimeQuestionCount))
        }
        return ScoreRanking.sortSchoolBattle(filtered, mode: mode, limit: limit)
    }

    func saveWithPendingRetry(kind: ScoreKind, entry: ScoreEntry) async -> SaveResult {
        let pending = localStore.queuePending(kind: kind, entry: entry)
        let delays: [UInt64] = [0, 1_500_000_000, 4_000_000_000]
        var lastError: Error?

        for delay in delays {
            if delay > 0 { try? await Task.sleep(nanoseconds: delay) }
            guard let attempt = localStore.updatePending(pending.id, patch: { item in
                item.attemptCount += 1
                item.lastAttemptAt = Date()
            }) else {
                return SaveResult(saved: true, message: "Resultatet er allerede behandlet.")
            }
            do {
                let result = try await save(kind: attempt.type, entry: attempt.entry)
                localStore.removePending(attempt.id)
                return result
            } catch {
                lastError = error
            }
        }

        if let lastError {
            print("[Regnemester highscore] Lagring ga opp: \(lastError.localizedDescription)")
        }
        return SaveResult(
            saved: false,
            message: "Runden er fullført, men resultatet kunne ikke lagres på highscore akkurat nå. Appen prøver igjen automatisk."
        )
    }

    func retryPendingSchoolBattleScores() async -> (saved: Int, failed: Int) {
        return await retryPendingHighscores(includeSchoolBattle: true, onlySchoolBattle: true)
    }

    func retryPendingHighscores(includeSchoolBattle: Bool, onlySchoolBattle: Bool = false) async -> (saved: Int, failed: Int) {
        let pending = localStore.loadPendingHighscores().filter { item in
            if onlySchoolBattle { return item.type.gameType == .schoolBattle }
            return includeSchoolBattle || item.type.gameType != .schoolBattle
        }
        guard !pending.isEmpty else { return (0, 0) }
        var saved = 0
        var failed = 0
        for item in pending {
            do {
                _ = try await save(kind: item.type, entry: item.entry)
                localStore.removePending(item.id)
                saved += 1
            } catch {
                failed += 1
            }
        }
        return (saved, failed)
    }

    func save(kind: ScoreKind, entry: ScoreEntry) async throws -> SaveResult {
        if let rest {
            do {
                return try await saveRemote(kind: kind, entry: entry, rest: rest)
            } catch {
                return try await saveRemoteViaRPC(kind: kind, entry: entry, rest: rest, originalError: error)
            }
        }
        return saveLocal(kind: kind, entry: entry)
    }

    private func saveRemote(kind: ScoreKind, entry: ScoreEntry, rest: SupabaseRESTClient) async throws -> SaveResult {
        var candidate = normalizedCandidate(kind: kind, entry: entry)
        candidate.id = UUID().uuidString.lowercased()
        let rows = try await loadRowsForRemoteList(kind: kind, entry: candidate, rest: rest)
        let limit = kind.gameType == .schoolBattle ? RegnemesterConstants.schoolBattleVisibleLimit : RegnemesterConstants.normalVisibleLimit
        let kept = ScoreRanking.topUnique(rows + [candidate], mode: candidate.mode, limit: limit)
        guard kept.contains(where: { $0.id == candidate.id }) else {
            try await cleanupRemote(kind: kind, entry: candidate, rest: rest)
            return SaveResult(saved: false, message: kind.gameType == .schoolBattle ? "Det holdt ikke til topp 20 i Skolekampen denne gangen." : "Det holdt ikke til topp 10 denne gangen.")
        }
        try await rest.insertScore(candidate)
        try await cleanupRemote(kind: kind, entry: candidate, rest: rest)
        return SaveResult(saved: true, message: kind.gameType == .schoolBattle ? "Du kom på Skolekampen-listen!" : "Du kom på highscore-listen!")
    }

    private func saveRemoteViaRPC(kind: ScoreKind, entry: ScoreEntry, rest: SupabaseRESTClient, originalError: Error) async throws -> SaveResult {
        let data: Data
        switch kind {
        case .normalScore:
            data = try await rest.callRPC("save_top_score", body: NormalScoreRPC(player_name: entry.name, player_score: entry.score, score_mode: entry.mode.rawValue, score_level: entry.level.rawValue, score_grade_level: entry.gradeLevel))
        case .normalTime:
            data = try await rest.callRPC("save_time_score", body: NormalTimeRPC(player_name: entry.name, player_time: entry.score, score_mode: entry.mode.rawValue, score_level: entry.level.rawValue, score_grade_level: entry.gradeLevel, score_question_count: entry.questionCount))
        case .schoolBattleScore:
            data = try await rest.callRPC("save_school_battle_score", body: SchoolScoreRPC(player_name: entry.name, player_score: entry.score, score_mode: entry.mode.rawValue, player_school: entry.school ?? "Ukjent skole"))
        case .schoolBattleTime:
            data = try await rest.callRPC("save_school_battle_time_score", body: SchoolTimeRPC(player_name: entry.name, player_time: entry.score, score_mode: entry.mode.rawValue, player_school: entry.school ?? "Ukjent skole", player_grade_group: entry.gradeGroup?.rawValue ?? GradeGroup.small.rawValue, score_question_count: RegnemesterConstants.schoolBattleTimeQuestionCount))
        }
        guard let result = decodeSaveResult(data) else { throw originalError }
        return result
    }

    private func saveLocal(kind: ScoreKind, entry: ScoreEntry) -> SaveResult {
        var candidate = normalizedCandidate(kind: kind, entry: entry)
        candidate.id = UUID().uuidString.lowercased()
        let current = localStore.loadScores()
        let limit = kind.gameType == .schoolBattle ? RegnemesterConstants.schoolBattleVisibleLimit : RegnemesterConstants.normalVisibleLimit
        let cleaned: (saved: Bool, scores: [ScoreEntry])
        if kind.gameType == .schoolBattle {
            cleaned = ScoreRanking.cleanLocalList(
                current: current,
                candidate: candidate,
                sameList: ScoreRanking.sameSchoolBattleList,
                limit: limit
            )
        } else {
            cleaned = ScoreRanking.cleanLocalList(
                current: current,
                candidate: candidate,
                sameList: ScoreRanking.sameNormalList,
                limit: limit
            )
        }
        localStore.saveScores(cleaned.scores)
        if !cleaned.saved {
            return SaveResult(saved: false, message: kind.gameType == .schoolBattle ? "Det holdt ikke til topp 20 i Skolekampen denne gangen." : "Det holdt ikke til topp 10 denne gangen.")
        }
        return SaveResult(saved: true, message: kind.gameType == .schoolBattle ? "Du kom på Skolekampen-listen!" : "Du kom på highscore-listen!")
    }

    private func normalizedCandidate(kind: ScoreKind, entry: ScoreEntry) -> ScoreEntry {
        var normalized = entry
        normalized.gameType = kind.gameType
        if kind.gameType == .schoolBattle {
            normalized.level = .medium
            normalized.school = entry.school ?? "Ukjent skole"
            normalized.gradeGroup = entry.gradeGroup ?? .small
            if entry.mode.isTimeChallenge {
                normalized.questionCount = RegnemesterConstants.schoolBattleTimeQuestionCount
            }
        } else if !entry.mode.isTimeChallenge {
            normalized.questionCount = 0
        }
        return normalized
    }

    private func loadRowsForRemoteList(kind: ScoreKind, entry: ScoreEntry, rest: SupabaseRESTClient) async throws -> [ScoreEntry] {
        var query = baseScoreSelectQuery(limit: 1000)
        query.append(contentsOf: remoteListFilters(kind: kind, entry: entry))
        query.append(URLQueryItem(name: "order", value: entry.mode.isTimeChallenge ? "score.asc" : "score.desc"))
        return try await rest.fetchScores(queryItems: query)
    }

    private func cleanupRemote(kind: ScoreKind, entry: ScoreEntry, rest: SupabaseRESTClient) async throws {
        let rows = try await loadRowsForRemoteList(kind: kind, entry: entry, rest: rest)
        let limit = kind.gameType == .schoolBattle ? RegnemesterConstants.schoolBattleVisibleLimit : RegnemesterConstants.normalVisibleLimit
        let keptIds = Set(ScoreRanking.topUnique(rows, mode: entry.mode, limit: limit).compactMap(\.id))
        let deleteIds = rows.compactMap(\.id).filter { !keptIds.contains($0) }
        try await rest.deleteScores(ids: deleteIds)
    }

    private func remoteListFilters(kind: ScoreKind, entry: ScoreEntry) -> [URLQueryItem] {
        if kind.gameType == .normal {
            var filters = [
                URLQueryItem(name: "game_type", value: "eq.normal"),
                URLQueryItem(name: "mode", value: "eq.\(entry.mode.rawValue)"),
                URLQueryItem(name: "level", value: "eq.\(entry.level.rawValue)"),
                URLQueryItem(name: "grade_level", value: "eq.\(entry.gradeLevel)")
            ]
            if entry.mode.isTimeChallenge {
                filters.append(URLQueryItem(name: "question_count", value: "eq.\(entry.questionCount)"))
            }
            return filters
        }

        var filters = [
            URLQueryItem(name: "game_type", value: "eq.school_battle"),
            URLQueryItem(name: "mode", value: "eq.\(entry.mode.rawValue)"),
            URLQueryItem(name: "school", value: "eq.\(entry.school ?? "Ukjent skole")")
        ]
        if entry.mode.isTimeChallenge {
            filters.append(URLQueryItem(name: "grade_group", value: "eq.\(entry.gradeGroup?.rawValue ?? GradeGroup.small.rawValue)"))
            filters.append(URLQueryItem(name: "question_count", value: "eq.\(RegnemesterConstants.schoolBattleTimeQuestionCount)"))
        }
        return filters
    }

    private func baseScoreSelectQuery(limit: Int) -> [URLQueryItem] {
        [
            URLQueryItem(name: "select", value: "id,name,score,mode,level,grade_level,game_type,question_count,school,grade_group"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
    }

    private func decodeSaveResult(_ data: Data) -> SaveResult? {
        let decoder = JSONDecoder()
        if let array = try? decoder.decode([SaveResult].self, from: data), let first = array.first { return first }
        if let result = try? decoder.decode(SaveResult.self, from: data) { return result }
        return nil
    }
}

private struct NormalScoreRPC: Encodable {
    var player_name: String
    var player_score: Int
    var score_mode: String
    var score_level: String
    var score_grade_level: Int
}

private struct NormalTimeRPC: Encodable {
    var player_name: String
    var player_time: Int
    var score_mode: String
    var score_level: String
    var score_grade_level: Int
    var score_question_count: Int
}

private struct SchoolScoreRPC: Encodable {
    var player_name: String
    var player_score: Int
    var score_mode: String
    var player_school: String
}

private struct SchoolTimeRPC: Encodable {
    var player_name: String
    var player_time: Int
    var score_mode: String
    var player_school: String
    var player_grade_group: String
    var score_question_count: Int
}
