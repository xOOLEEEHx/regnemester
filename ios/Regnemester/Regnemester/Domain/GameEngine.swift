import Foundation

enum GameEngine {
    static func levelMax(_ level: GameLevel = .medium, mode: GameMode = .multiplication) -> Int {
        if mode == .addition || mode == .subtraction {
            switch level {
            case .easy: return 20
            case .medium: return 100
            case .hard: return 1000
            }
        }
        switch level {
        case .easy: return 5
        case .medium: return 10
        case .hard: return 20
        }
    }

    static func levelDescription(mode: GameMode, level: GameLevel) -> String {
        if mode == .mixed { return "\(level.label): oppgaver fra +, −, × og ÷" }
        let max = levelMax(level, mode: mode)
        switch mode {
        case .addition: return "\(level.label): addisjon med svar fra 0–\(max)"
        case .subtraction: return "\(level.label): subtraksjon uten minus, tall fra 0–\(max)"
        case .division: return "\(level.label): deling med tall fra 1–\(max)"
        case .multiplication: return "\(level.label): gangestykker fra 0–\(max)"
        case .mixed: return "\(level.label): blandede oppgaver"
        }
    }

    static func createQuestionDeck(mode: GameMode = .multiplication, level: GameLevel = .medium, gradeGroup: GradeGroup? = nil) -> [Question] {
        var questions: [Question] = []
        let max = levelMax(level, mode: mode)
        if mode == .mixed {
            for _ in 0..<240 { questions.append(makeMixedQuestion(level: level)) }
            return questions.shuffled()
        }
        if (mode == .addition || mode == .subtraction), let gradeGroup {
            for category in 0..<5 {
                for _ in 0..<5 {
                    questions.append(makeSchoolBattleCalculationQuestion(mode: mode, gradeGroup: gradeGroup, category: category))
                }
            }
            return questions.shuffled()
        }
        if mode == .addition {
            for _ in 0..<200 { questions.append(makeAdditionQuestion(level: level)) }
            return questions.shuffled()
        }
        if mode == .subtraction {
            for _ in 0..<200 { questions.append(makeSubtractionQuestion(level: level)) }
            return questions.shuffled()
        }
        if mode == .division {
            let answerMax = level == .easy ? 10 : max
            for divisor in 1...max {
                for answer in 1...answerMax {
                    questions.append(makeDivisionQuestion(divisor: divisor, answer: answer, max: answerMax))
                }
            }
            return questions.shuffled()
        }
        let multiplierMax = level == .easy ? 10 : max
        for a in 0...max {
            for b in 0...multiplierMax {
                questions.append(makeMultiplicationQuestion(a: a, b: b))
            }
        }
        return questions.shuffled()
    }

    static func makeQuestion(mode: GameMode = .multiplication, level: GameLevel = .medium) -> Question {
        createQuestionDeck(mode: mode, level: level).first ?? makeMultiplicationQuestion(a: 1, b: 1)
    }

    static func makeMultiplicationQuestion(a: Int, b: Int) -> Question {
        let correct = a * b
        return Question(mode: .multiplication, a: a, b: b, symbol: "×", correct: correct, options: makeOptions(correct: correct, mode: .multiplication))
    }

    static func makeDivisionQuestion(divisor: Int, answer: Int, max: Int = 10) -> Question {
        let dividend = divisor * answer
        return Question(mode: .division, a: dividend, b: divisor, symbol: "÷", correct: answer, options: makeOptions(correct: answer, mode: .division, max: max))
    }

    static func makeAdditionQuestion(level: GameLevel = .medium) -> Question {
        let max = levelMax(level, mode: .addition)
        let a = Int.random(in: 0...max)
        let b = Int.random(in: 0...Swift.max(0, max - a))
        let correct = a + b
        return Question(mode: .addition, a: a, b: b, symbol: "+", correct: correct, options: makeOptions(correct: correct, mode: .addition))
    }

    static func makeSubtractionQuestion(level: GameLevel = .medium) -> Question {
        let max = levelMax(level, mode: .subtraction)
        let a = Int.random(in: 0...max)
        let b = Int.random(in: 0...a)
        let correct = a - b
        return Question(mode: .subtraction, a: a, b: b, symbol: "−", correct: correct, options: makeOptions(correct: correct, mode: .subtraction))
    }

    static func makeMixedQuestion(level: GameLevel = .medium) -> Question {
        let mode = [GameMode.addition, .subtraction, .multiplication, .division].randomElement() ?? .multiplication
        switch mode {
        case .addition: return makeAdditionQuestion(level: level)
        case .subtraction: return makeSubtractionQuestion(level: level)
        case .division:
            let max = levelMax(level, mode: mode)
            return makeDivisionQuestion(divisor: Int.random(in: 1...max), answer: Int.random(in: 1...max), max: max)
        case .multiplication:
            let max = levelMax(level, mode: mode)
            return makeMultiplicationQuestion(a: Int.random(in: 0...max), b: Int.random(in: 0...max))
        case .mixed:
            return makeMultiplicationQuestion(a: 1, b: 1)
        }
    }

    static func makeSchoolBattleCalculationQuestion(mode: GameMode, gradeGroup: GradeGroup = .small, category: Int = Int.random(in: 0...4)) -> Question {
        if gradeGroup == .middle {
            if mode == .addition {
                switch category {
                case 0: return makeCalculationQuestion(mode: mode, a: Int.random(in: 20...99), b: Int.random(in: 20...99))
                case 1:
                    let a = Int.random(in: 100...900)
                    return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 10...min(99, 999 - a)))
                case 2:
                    let a = Int.random(in: 100...800)
                    return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 100...min(999 - a, 899)))
                case 3:
                    let a = Int.random(in: 1...9) * 100
                    return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 0...(10 - a / 100)) * 100)
                default:
                    let a = Int.random(in: 100...900)
                    return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 1...(999 - a)))
                }
            }
            switch category {
            case 0: return makeCalculationQuestion(mode: mode, a: Int.random(in: 40...99), b: Int.random(in: 20...40))
            case 1:
                let a = Int.random(in: 100...999)
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 10...min(99, a)))
            case 2:
                let a = Int.random(in: 200...999)
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 100...a))
            case 3:
                let a = Int.random(in: 2...10) * 100
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 0...(a / 100)) * 100)
            default:
                let a = Int.random(in: 100...999)
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 1...a))
            }
        }

        if mode == .addition {
            switch category {
            case 0:
                let a = Int.random(in: 0...10)
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 0...min(9, 19 - a)))
            case 1:
                let a = Int.random(in: 5...9)
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: (10 - a)...10))
            case 2:
                let a = Int.random(in: 10...95)
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 1...min(9, 99 - a)))
            case 3:
                let a = Int.random(in: 1...9) * 10
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 0...(10 - a / 10)) * 10)
            default:
                let a = Int.random(in: 10...80)
                return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 10...(99 - a)))
            }
        }

        switch category {
        case 0:
            let a = Int.random(in: 1...20)
            return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 0...min(10, a)))
        case 1:
            let a = Int.random(in: 11...20)
            let minB = min(a, (a % 10) + 1)
            return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: minB...min(a, 9)))
        case 2:
            let a = Int.random(in: 10...99)
            return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 1...min(9, a)))
        case 3:
            let a = Int.random(in: 2...10) * 10
            return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 0...(a / 10)) * 10)
        default:
            let a = Int.random(in: 20...99)
            return makeCalculationQuestion(mode: mode, a: a, b: Int.random(in: 10...a))
        }
    }

    static func makeCalculationQuestion(mode: GameMode, a: Int, b: Int) -> Question {
        let correct = mode == .addition ? a + b : a - b
        let symbol = mode == .addition ? "+" : "−"
        return Question(mode: mode, a: a, b: b, symbol: symbol, correct: correct, options: makeOptions(correct: correct, mode: mode))
    }

    static func makeOptions(correct: Int, mode: GameMode, max: Int = 10) -> [Int] {
        var wrongs = Set<Int>()
        var guardCount = 0
        while wrongs.count < 3 && guardCount < 200 {
            guardCount += 1
            let candidate = mode == .division ? randomDivisionWrongAnswer(correct: correct, max: max) : randomWrongAnswer(correct: correct)
            if candidate != correct { wrongs.insert(candidate) }
        }
        var fallback = 0
        while wrongs.count < 3 {
            if fallback != correct { wrongs.insert(fallback) }
            fallback += 1
        }
        return ([correct] + Array(wrongs)).shuffled()
    }

    static func randomWrongAnswer(correct: Int) -> Int {
        if correct == 0 { return Int.random(in: 1...20) }
        let strategies = [
            correct + Int.random(in: -4...4),
            correct + 10,
            correct - 10,
            correct + Int.random(in: 1...12),
            Swift.max(1, correct - Int.random(in: 1...12))
        ]
        return Swift.max(0, strategies.randomElement() ?? correct + 1)
    }

    static func randomDivisionWrongAnswer(correct: Int, max: Int = 10) -> Int {
        let nearby = [correct - 4, correct - 3, correct - 2, correct - 1, correct + 1, correct + 2, correct + 3, correct + 4]
            .filter { $0 >= 1 && $0 <= max && $0 != correct }
        if let value = nearby.randomElement() { return value }
        var candidate = correct
        while candidate == correct { candidate = Int.random(in: 1...max) }
        return candidate
    }

    static func stars(for score: Int) -> Int {
        if score >= 30 { return 5 }
        if score >= 20 { return 4 }
        if score >= 15 { return 3 }
        if score >= 8 { return 2 }
        return 1
    }

    static func message(for score: Int) -> String {
        if score >= 30 { return "Regnemester!" }
        if score >= 20 { return "Kjempebra!" }
        if score >= 15 { return "Sterkt jobbet!" }
        if score >= 8 { return "Bra innsats!" }
        return "God start!"
    }

    static func normalResultFeedback(accuracy: Int) -> String {
        switch accuracy {
        case 100...: return "Perfekt runde! Alle svarene var riktige."
        case 90...: return "Fantastisk presisjon! Du traff på nesten alt."
        case 70...: return "Sterk runde! Du hadde god kontroll."
        case 50...: return "Bra jobbet! Øv litt til, så blir du enda tryggere."
        default: return "God innsats! Prøv igjen og se om du klarer flere riktige."
        }
    }

    static func bossDamage(for streak: Int) -> Int {
        streak >= 5 ? 2 : 1
    }

    static func bossAttackName(for bossId: String) -> String {
        switch bossId {
        case "troll": "Trollslag!"
        case "regnemesteren": "Mesterstøt!"
        case "morkekraken": "Dypvannsslag!"
        case "mekamaskinen": "Tannhjulsangrep!"
        case "krystallvokteren": "Krystallslag!"
        case "stormornen": "Tordenklør!"
        case "lavakjempen": "Lavabrøl!"
        case "isdragen": "Frostpust!"
        case "shadow": "Skyggestøt!"
        default: "Slimangrep!"
        }
    }
}
