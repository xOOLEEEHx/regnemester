import Foundation

enum GameMode: String, Codable, CaseIterable, Identifiable, Hashable {
    case addition
    case subtraction
    case multiplication
    case division
    case mixed

    var id: String { rawValue }

    static let practiceModes: [GameMode] = [.addition, .subtraction, .multiplication, .division, .mixed]
    static let schoolModes: [GameMode] = [.addition, .subtraction, .multiplication, .division]

    var name: String {
        switch self {
        case .addition: "Addisjon"
        case .subtraction: "Subtraksjon"
        case .multiplication: "Multiplikasjon"
        case .division: "Divisjon"
        case .mixed: "Blanding"
        }
    }

    var symbol: String {
        switch self {
        case .addition: "+"
        case .subtraction: "−"
        case .multiplication: "×"
        case .division: "÷"
        case .mixed: ""
        }
    }

    var label: String {
        symbol.isEmpty ? name : "\(name) (\(symbol))"
    }

    var isTimeChallenge: Bool {
        self == .addition || self == .subtraction
    }
}

enum GameLevel: String, Codable, CaseIterable, Identifiable, Hashable {
    case easy
    case medium
    case hard

    var id: String { rawValue }

    var label: String {
        switch self {
        case .easy: "Lett"
        case .medium: "Middels"
        case .hard: "Vanskelig"
        }
    }
}

enum GameType: String, Codable, Hashable {
    case normal
    case schoolBattle = "school_battle"
    case bossBattle = "boss_battle"
}

enum GradeGroup: String, Codable, CaseIterable, Identifiable, Hashable {
    case small
    case middle

    var id: String { rawValue }

    var label: String {
        switch self {
        case .small: "Småtrinn"
        case .middle: "Mellomtrinn"
        }
    }

    static func group(for gradeLevel: Int) -> GradeGroup {
        gradeLevel >= 5 ? .middle : .small
    }
}

enum RegnemesterConstants {
    static let normalGameSeconds = 60
    static let schoolBattleSeconds = 70
    static let timePenaltySeconds = 5
    static let schoolBattleTimeQuestionCount = 25
    static let normalVisibleLimit = 10
    static let schoolBattleVisibleLimit = 20
    static let normalVisibleFetchLimit = 1000
    static let schoolBattleVisibleFetchLimit = 1000
    static let questionCountOptions = [10, 20, 30, 40]
    static let gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8]
    static let schoolBattleGradeOptions = [1, 2, 3, 4, 5, 6, 7]
    static let schools = [
        "Austafjord skole",
        "Foldereid oppvekstsenter",
        "Gravvik oppvekstsenter",
        "Kolvereid skole",
        "Nærøysundet skole",
        "Rørvik skole"
    ]
}

struct Question: Identifiable, Codable, Equatable, Hashable {
    var id = UUID()
    var mode: GameMode
    var a: Int
    var b: Int
    var symbol: String
    var correct: Int
    var options: [Int]
}

struct RoundResult: Identifiable, Codable, Equatable {
    var id = UUID()
    var gameType: GameType
    var mode: GameMode
    var level: GameLevel
    var gradeLevel: Int
    var questionCount: Int
    var score: Int
    var correctAnswers: Int
    var wrongAnswers: Int
    var timeSeconds: Int
    var bestStreak: Int
    var school: String
    var gradeGroup: GradeGroup
    var message: String
    var highscoreMessage: String

    var stars: Int {
        GameEngine.stars(for: score)
    }

    var accuracy: Int {
        let total = correctAnswers + wrongAnswers
        guard total > 0 else { return 0 }
        return Int((Double(correctAnswers) / Double(total) * 100).rounded())
    }
}

enum AnswerFeedback: Equatable {
    case correct
    case wrong
}

enum LoadState<Value> {
    case idle
    case loading
    case loaded(Value)
    case failed(String)
}

func gradeLabel(_ gradeLevel: Int) -> String {
    gradeLevel == 8 ? "Eldre" : "\(gradeLevel). klasse"
}

func schoolBattleClassLabel(_ gradeLevel: Int) -> String {
    RegnemesterConstants.schoolBattleGradeOptions.contains(gradeLevel) ? "\(gradeLevel). klasse" : "Ukjent klasse"
}

func formattedTime(_ totalSeconds: Int) -> String {
    let safeSeconds = max(0, totalSeconds)
    let minutes = safeSeconds / 60
    let seconds = safeSeconds % 60
    if minutes <= 0 { return "\(seconds) sek" }
    return "\(minutes) min \(String(format: "%02d", seconds)) sek"
}
