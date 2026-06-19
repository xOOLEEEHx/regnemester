import Foundation

enum PlayerNameValidator {
    static let minLength = 2
    static let maxLength = 24
    static let inputMaxLength = 32
    static let maxParts = 3

    private static let blockedContains: [String] = [
        "faen", "faan", "fanden", "satan", "helvete", "hælvete", "jævel", "dritt",
        "shit", "bæsj", "tiss", "piss", "idiot", "dust", "taper", "loser", "mongo",
        "retard", "teit", "stygg", "feit", "dum", "mobber", "slem", "ekkel",
        "sex", "sexy", "porno", "naken", "penis", "pikk", "kuk", "fitte", "vagina",
        "hore", "fuck", "bitch", "asshole", "kill", "drep", "mord", "blood",
        "kniv", "gun", "våpen", "bomb", "nazi", "hitler", "rasist", "terror",
        "alkohol", "vodka", "beer", "dop", "drug", "weed", "hasj", "snus", "vape"
    ]

    private static let blockedExact: Set<String> = ["ass", "tit", "poo", "pee", "die", "dum", "slem", "stygg", "feit", "teit"]
    private static let allowedScalars = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÆØÅæøå -")

    static func normalize(_ name: String) -> String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: .whitespaces)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }

    static func validate(_ name: String) -> String? {
        let clean = normalize(name)
        if clean.count < minLength { return "Skriv minst \(minLength) tegn." }
        if clean.count > maxLength { return "Navnet kan maks være \(maxLength) tegn." }
        if clean.split(separator: " ").count > maxParts { return "Bruk maks \(maxParts) navnedeler." }
        if clean.rangeOfCharacter(from: allowedScalars.inverted) != nil {
            return "Bruk bokstaver, tall, bindestrek og ett mellomrom mellom navn."
        }
        if hasBlockedContent(clean) {
            return "Velg et hyggelig spillnavn."
        }
        return nil
    }

    static func hasBlockedContent(_ name: String) -> Bool {
        let folded = name.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "nb_NO"))
        let normalized = folded.lowercased()
        let compact = normalized.replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: "-", with: "")
        if blockedExact.contains(normalized) || blockedExact.contains(compact) { return true }
        return blockedContains.contains { blocked in
            normalized.contains(blocked) || compact.contains(blocked)
        }
    }
}
