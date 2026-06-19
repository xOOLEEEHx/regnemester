import Foundation

struct ScoreEntry: Codable, Identifiable, Hashable {
    var id: String? = nil
    var name: String
    var score: Int
    var mode: GameMode
    var level: GameLevel
    var gradeLevel: Int
    var gameType: GameType
    var questionCount: Int
    var school: String? = nil
    var gradeGroup: GradeGroup? = nil

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case score
        case mode
        case level
        case gradeLevel = "grade_level"
        case gameType = "game_type"
        case questionCount = "question_count"
        case school
        case gradeGroup = "grade_group"
    }
}

enum ScoreKind: String, Codable {
    case normalScore = "normal_score"
    case normalTime = "normal_time"
    case schoolBattleScore = "school_battle_score"
    case schoolBattleTime = "school_battle_time"

    var gameType: GameType {
        switch self {
        case .schoolBattleScore, .schoolBattleTime: .schoolBattle
        case .normalScore, .normalTime: .normal
        }
    }
}

struct SaveResult: Codable, Equatable {
    var saved: Bool
    var message: String
}

struct PendingHighscore: Codable, Identifiable, Hashable {
    var id: String
    var type: ScoreKind
    var entry: ScoreEntry
    var createdAt: Date
    var attemptCount: Int
    var lastAttemptAt: Date?
}

struct AnnouncementSettings: Codable, Equatable {
    var enabled: Bool
    var title: String
    var message: String
    var version: String

    static let empty = AnnouncementSettings(enabled: false, title: "Nyhet i Regnemester!", message: "", version: "")

    var dismissKey: String {
        let cleanVersion = version.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanVersion.isEmpty { return cleanVersion }
        return "\(title)|\(message)"
    }
}

enum AppSettingKey {
    static let schoolBattleEnabled = "school_battle_enabled"
    static let announcementEnabled = "announcement_enabled"
    static let announcementTitle = "announcement_title"
    static let announcementMessage = "announcement_message"
    static let announcementVersion = "announcement_version"

    static let announcementKeys = [
        announcementEnabled,
        announcementTitle,
        announcementMessage,
        announcementVersion
    ]
}
