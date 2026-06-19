import Foundation

enum Route: Hashable {
    case normalMode
    case school
    case schoolClass
    case schoolMode
    case start
    case play
    case result
    case highscoreHome
    case schoolHighscore
    case normalHighscore
    case bossMode
    case bossSelect
    case bossPlay
    case bossResult
    case adminLogin
    case adminHome
    case adminNormal
    case adminSchool
    case qr
}

enum SheetDestination: Identifiable, Hashable {
    case announcement

    var id: String {
        switch self {
        case .announcement: "announcement"
        }
    }
}
