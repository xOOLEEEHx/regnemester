import Foundation

struct BossDefinition: Identifiable, Codable, Equatable, Hashable {
    var id: String
    var name: String
    var treasureName: String
    var lives: Int
    var hearts: Int
    var arena: String
    var shortIcon: String
    var treasureSize: TreasureSize
    var accentHex: String
    var unlockKey: String? = nil
    var legacyUnlockKey: String? = nil
    var lockedText: String? = nil
    var unlockedByDefault: Bool = false

    var assetFolder: String {
        switch id {
        case "troll": "trollkongen"
        case "shadow": "skyggegolemen"
        default: id
        }
    }

    static let all: [BossDefinition] = [
        .init(id: "slime", name: "Slimbossen", treasureName: "Slimbossens skatt", lives: 10, hearts: 5, arena: "Slimmyra", shortIcon: "SLIM", treasureSize: .small, accentHex: "#16a34a", unlockedByDefault: true),
        .init(id: "troll", name: "Trollkongen", treasureName: "Trollkongens skatt", lives: 20, hearts: 4, arena: "Trollhulen", shortIcon: "TROLL", treasureSize: .medium, accentHex: "#b45309", unlockedByDefault: true),
        .init(id: "shadow", name: "Skyggegolemen", treasureName: "Skyggegolemens skatt", lives: 30, hearts: 3, arena: "Skyggeborgen", shortIcon: "GOLEM", treasureSize: .large, accentHex: "#111827", unlockedByDefault: true),
        .init(id: "isdragen", name: "Isdragen", treasureName: "Isdragens skatt", lives: 40, hearts: 3, arena: "Frostfjellene", shortIcon: "IS", treasureSize: .large, accentHex: "#0284c7", unlockKey: "isdragen", legacyUnlockKey: "ice", lockedText: "Slå Skyggegolemen for å låse opp", unlockedByDefault: false),
        .init(id: "lavakjempen", name: "Lavakjempen", treasureName: "Lavakjempens skatt", lives: 50, hearts: 3, arena: "Vulkanringen", shortIcon: "LAVA", treasureSize: .large, accentHex: "#dc2626", unlockKey: "lavakjempen", legacyUnlockKey: "lava", lockedText: "Slå Isdragen for å låse opp", unlockedByDefault: false),
        .init(id: "stormornen", name: "Stormørnen", treasureName: "Stormørnens skatt", lives: 60, hearts: 3, arena: "Tordentoppen", shortIcon: "STORM", treasureSize: .large, accentHex: "#2563eb", unlockKey: "stormornen", legacyUnlockKey: "storm", lockedText: "Slå Lavakjempen for å låse opp", unlockedByDefault: false),
        .init(id: "krystallvokteren", name: "Krystallvokteren", treasureName: "Krystallvokterens skatt", lives: 70, hearts: 3, arena: "Krystallgrotten", shortIcon: "KRYST", treasureSize: .large, accentHex: "#7c3aed", unlockKey: "krystallvokteren", lockedText: "Slå Stormørnen for å låse opp", unlockedByDefault: false),
        .init(id: "mekamaskinen", name: "Mekamaskinen", treasureName: "Mekamaskinens skatt", lives: 80, hearts: 3, arena: "Tannhjulsbyen", shortIcon: "MEKA", treasureSize: .large, accentHex: "#475569", unlockKey: "mekamaskinen", legacyUnlockKey: "mecha", lockedText: "Slå Krystallvokteren for å låse opp", unlockedByDefault: false),
        .init(id: "morkekraken", name: "Mørkekraken", treasureName: "Mørkekrakens skatt", lives: 90, hearts: 3, arena: "Dypvannshavet", shortIcon: "KRAKEN", treasureSize: .large, accentHex: "#0891b2", unlockKey: "morkekraken", legacyUnlockKey: "kraken", lockedText: "Slå Mekamaskinen for å låse opp", unlockedByDefault: false),
        .init(id: "regnemesteren", name: "Regnemesteren", treasureName: "Regnemesterens skatt", lives: 100, hearts: 3, arena: "Den siste arenaen", shortIcon: "MESTER", treasureSize: .large, accentHex: "#7c3aed", unlockKey: "regnemesteren", lockedText: "Slå Mørkekraken for å låse opp", unlockedByDefault: false)
    ]
}

enum TreasureSize: String, Codable, Hashable {
    case small
    case medium
    case large
}

enum BossOutcome: String, Codable {
    case won
    case lost
}

enum BossVisualState {
    case idle
    case hurt1
    case hurt2
    case attack
    case lowHp
    case defeated
}

extension BossDefinition {
    func isUnlocked(with unlocks: [String: Bool]) -> Bool {
        if unlockedByDefault { return true }
        return [unlockKey, legacyUnlockKey].compactMap { $0 }.contains { unlocks[$0] == true }
    }

    func imagePath(for state: BossVisualState) -> String {
        let folder = assetFolder
        switch (id, state) {
        case ("slime", .idle): return "bosses/slime/slime-boss-idle.png"
        case ("slime", .hurt1): return "bosses/slime/slime-boss-hurt-01.png"
        case ("slime", .hurt2): return "bosses/slime/slime-boss-hurt-02.png"
        case ("slime", .attack): return "bosses/slime/slime-boss-attack.png"
        case ("slime", .lowHp): return "bosses/slime/slime-boss-low-hp.png"
        case ("slime", .defeated): return "bosses/slime/slime-boss-defeated.png"
        default:
            let base = "bosses/\(folder)/\(folder)"
            switch state {
            case .idle: return "\(base)-idle.png"
            case .hurt1: return "\(base)-hurt-1.png"
            case .hurt2: return "\(base)-hurt-2.png"
            case .attack: return "\(base)-attack.png"
            case .lowHp: return "\(base)-low-hp.png"
            case .defeated: return "\(base)-defeated.png"
            }
        }
    }

    var panelBackgroundPath: String {
        if id == "slime" { return "bosses/slime/slime-panel-bg.png" }
        return "bosses/\(assetFolder)/\(assetFolder)-panel-bg.png"
    }

    var finalDiplomaPath: String {
        "bosses/regnemesteren/regnemesteren-final-diploma.png"
    }
}
