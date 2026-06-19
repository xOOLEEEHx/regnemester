import Foundation

enum ScoreRanking {
    static func sortNormal(_ scores: [ScoreEntry], mode: GameMode, limit: Int = RegnemesterConstants.normalVisibleLimit) -> [ScoreEntry] {
        let sorted = scores
            .filter { $0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false }
            .sorted { first, second in
                mode.isTimeChallenge ? first.score < second.score : first.score > second.score
            }
        return Array(sorted.prefix(limit))
    }

    static func sortSchoolBattle(_ scores: [ScoreEntry], mode: GameMode, limit: Int = RegnemesterConstants.schoolBattleVisibleLimit) -> [ScoreEntry] {
        let sorted = scores
            .filter { $0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false }
            .sorted { first, second in
                mode.isTimeChallenge ? first.score < second.score : first.score > second.score
            }
        return Array(sorted.prefix(limit))
    }

    static func dedupeNormal(_ scores: [ScoreEntry], mode: GameMode, limit: Int = RegnemesterConstants.normalVisibleLimit) -> [ScoreEntry] {
        var bestByPlayer: [String: ScoreEntry] = [:]
        for score in scores {
            let key = normalPlayerKey(score)
            if isBetter(score, than: bestByPlayer[key], mode: mode) {
                bestByPlayer[key] = score
            }
        }
        return sortNormal(Array(bestByPlayer.values), mode: mode, limit: limit)
    }

    static func dedupeSchoolBattle(_ scores: [ScoreEntry], mode: GameMode, limit: Int = RegnemesterConstants.schoolBattleVisibleLimit) -> [ScoreEntry] {
        var bestByPlayer: [String: ScoreEntry] = [:]
        for score in scores {
            let key = schoolBattlePlayerKey(score)
            if isBetter(score, than: bestByPlayer[key], mode: mode) {
                bestByPlayer[key] = score
            }
        }
        return sortSchoolBattle(Array(bestByPlayer.values), mode: mode, limit: limit)
    }

    static func isBetter(_ candidate: ScoreEntry, than current: ScoreEntry?, mode: GameMode) -> Bool {
        guard let current else { return true }
        if candidate.score == current.score { return false }
        return mode.isTimeChallenge ? candidate.score < current.score : candidate.score > current.score
    }

    static func sameNormalList(_ entry: ScoreEntry, reference: ScoreEntry) -> Bool {
        guard entry.gameType == .normal,
              entry.mode == reference.mode,
              entry.level == reference.level,
              entry.gradeLevel == reference.gradeLevel else { return false }
        if !reference.mode.isTimeChallenge { return true }
        return entry.questionCount == reference.questionCount
    }

    static func sameSchoolBattleList(_ entry: ScoreEntry, reference: ScoreEntry) -> Bool {
        guard entry.gameType == .schoolBattle,
              entry.mode == reference.mode,
              (entry.school ?? "Ukjent skole").caseInsensitiveCompare(reference.school ?? "Ukjent skole") == .orderedSame else { return false }
        if !reference.mode.isTimeChallenge { return true }
        return entry.gradeGroup == reference.gradeGroup &&
            entry.questionCount == RegnemesterConstants.schoolBattleTimeQuestionCount
    }

    static func cleanLocalList(current: [ScoreEntry], candidate: ScoreEntry, sameList: (ScoreEntry, ScoreEntry) -> Bool, limit: Int) -> (saved: Bool, scores: [ScoreEntry]) {
        let updated = current + [candidate]
        let sameScores = updated.filter { sameList($0, candidate) }
        let kept = topUnique(sameScores, mode: candidate.mode, limit: limit)
        let keptIds = Set(kept.map { stableIdentity($0) })
        return (
            keptIds.contains(stableIdentity(candidate)),
            updated.filter { !sameList($0, candidate) || keptIds.contains(stableIdentity($0)) }
        )
    }

    static func topUnique(_ entries: [ScoreEntry], mode: GameMode, limit: Int) -> [ScoreEntry] {
        var bestByPlayer: [String: ScoreEntry] = [:]
        for entry in entries {
            let key = scorePlayerKey(entry)
            if key.isEmpty { continue }
            if isBetter(entry, than: bestByPlayer[key], mode: mode) {
                bestByPlayer[key] = entry
            }
        }
        let sorted = bestByPlayer.values.sorted { first, second in
            mode.isTimeChallenge ? first.score < second.score : first.score > second.score
        }
        return Array(sorted.prefix(limit))
    }

    private static func normalPlayerKey(_ entry: ScoreEntry) -> String {
        let question = entry.mode.isTimeChallenge ? "\(entry.questionCount)" : "score"
        return "\(entry.mode.rawValue)|\(entry.level.rawValue)|\(entry.gradeLevel)|\(question)|\(entry.name.lowercased())"
    }

    private static func schoolBattlePlayerKey(_ entry: ScoreEntry) -> String {
        "\(entry.school?.lowercased() ?? "ukjent skole")|\(entry.mode.rawValue)|\(entry.gradeLevel)|\(entry.name.lowercased())"
    }

    private static func scorePlayerKey(_ entry: ScoreEntry) -> String {
        if entry.gameType == .schoolBattle || entry.school != nil {
            return schoolBattlePlayerKey(entry)
        }
        return entry.name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private static func stableIdentity(_ entry: ScoreEntry) -> String {
        if let id = entry.id { return id }
        return "\(entry.name)|\(entry.score)|\(entry.mode.rawValue)|\(entry.gameType.rawValue)|\(entry.school ?? "")|\(entry.questionCount)"
    }
}
