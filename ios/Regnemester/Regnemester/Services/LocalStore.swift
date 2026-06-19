import Foundation

final class LocalStore {
    private enum Key {
        static let highscores = "gangemester_highscores_v1"
        static let pendingHighscores = "regnemester_pending_highscores_v1"
        static let bossUnlocks = "regnemester_boss_ladder_unlocks_v1"
        static let dismissedAnnouncement = "regnemester_dismissed_announcement_v1"
        static let localAnnouncement = "regnemester_announcement_settings_v1"
    }

    private let defaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func loadScores() -> [ScoreEntry] {
        decode([ScoreEntry].self, forKey: Key.highscores) ?? []
    }

    func saveScores(_ scores: [ScoreEntry]) {
        encode(scores, forKey: Key.highscores)
    }

    func loadPendingHighscores() -> [PendingHighscore] {
        decode([PendingHighscore].self, forKey: Key.pendingHighscores) ?? []
    }

    func savePendingHighscores(_ pending: [PendingHighscore]) {
        let unique = Array(Dictionary(grouping: pending, by: \.id).compactMap { $0.value.last }.suffix(50))
        encode(unique, forKey: Key.pendingHighscores)
    }

    func queuePending(kind: ScoreKind, entry: ScoreEntry) -> PendingHighscore {
        var pending = loadPendingHighscores()
        let item = PendingHighscore(id: UUID().uuidString.lowercased(), type: kind, entry: entry, createdAt: Date(), attemptCount: 0, lastAttemptAt: nil)
        pending.append(item)
        savePendingHighscores(pending)
        return item
    }

    func updatePending(_ id: String, patch: (inout PendingHighscore) -> Void) -> PendingHighscore? {
        var pending = loadPendingHighscores()
        guard let index = pending.firstIndex(where: { $0.id == id }) else { return nil }
        patch(&pending[index])
        let item = pending[index]
        savePendingHighscores(pending)
        return item
    }

    func removePending(_ id: String) {
        savePendingHighscores(loadPendingHighscores().filter { $0.id != id })
    }

    func loadBossUnlocks() -> [String: Bool] {
        decode([String: Bool].self, forKey: Key.bossUnlocks) ?? [:]
    }

    func saveBossUnlocks(_ unlocks: [String: Bool]) {
        encode(unlocks, forKey: Key.bossUnlocks)
    }

    func resetBossUnlocks() {
        defaults.removeObject(forKey: Key.bossUnlocks)
    }

    func dismissedAnnouncementKey() -> String {
        defaults.string(forKey: Key.dismissedAnnouncement) ?? ""
    }

    func dismissAnnouncement(_ key: String) {
        defaults.set(key, forKey: Key.dismissedAnnouncement)
    }

    func loadLocalAnnouncementSettings() -> AnnouncementSettings {
        decode(AnnouncementSettings.self, forKey: Key.localAnnouncement) ?? .empty
    }

    func saveLocalAnnouncementSettings(_ settings: AnnouncementSettings) {
        encode(settings, forKey: Key.localAnnouncement)
    }

    private func decode<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
        guard let data = defaults.data(forKey: key) else { return nil }
        return try? decoder.decode(type, from: data)
    }

    private func encode<T: Encodable>(_ value: T, forKey key: String) {
        guard let data = try? encoder.encode(value) else { return }
        defaults.set(data, forKey: key)
    }
}
