import Foundation
import Observation

@MainActor
@Observable
final class BossBattleStore {
    var mode: GameMode = .addition
    var level: GameLevel = .medium
    var bossId = "slime"
    var unlocks: [String: Bool]
    var roundID = UUID()
    var isPlaying = false
    var deck: [Question] = []
    var question = GameEngine.makeQuestion(mode: .addition, level: .medium)
    var feedback: AnswerFeedback?
    var bossLives = 0
    var bossMaxLives = 0
    var playerHearts = 0
    var playerMaxHearts = 0
    var currentStreak = 0
    var bestStreak = 0
    var correctAnswers = 0
    var wrongAnswers = 0
    var outcome: BossOutcome?
    var message = ""
    var bossHit = false
    var playerHit = false
    var damageText: String?
    var finalDiplomaName = ""
    var finalDiplomaNameError = ""
    var finalDiplomaReady = false
    var resetMessage = ""

    @ObservationIgnored private var localStore: LocalStore

    init(localStore: LocalStore) {
        self.localStore = localStore
        self.unlocks = localStore.loadBossUnlocks()
    }

    var boss: BossDefinition {
        BossDefinition.all.first(where: { $0.id == bossId }) ?? BossDefinition.all[0]
    }

    var hpPercent: Double {
        guard bossMaxLives > 0 else { return 0 }
        return max(0, min(100, Double(bossLives) / Double(bossMaxLives) * 100))
    }

    var visualState: BossVisualState {
        if outcome == .won { return .defeated }
        if playerHit { return .attack }
        if bossHit { return bossLives % 2 == 0 ? .hurt1 : .hurt2 }
        if hpPercent <= 35 { return .lowHp }
        return .idle
    }

    var isSuperReady: Bool {
        currentStreak >= 4
    }

    func isUnlocked(_ boss: BossDefinition) -> Bool {
        boss.isUnlocked(with: unlocks)
    }

    func start() -> Bool {
        guard isUnlocked(boss) else { return false }
        deck = GameEngine.createQuestionDeck(mode: mode, level: level)
        question = nextQuestion()
        bossLives = boss.lives
        bossMaxLives = boss.lives
        playerHearts = boss.hearts
        playerMaxHearts = boss.hearts
        currentStreak = 0
        bestStreak = 0
        correctAnswers = 0
        wrongAnswers = 0
        outcome = nil
        message = "\(boss.name) er klar. Svar riktig for å angripe!"
        damageText = nil
        bossHit = false
        playerHit = false
        feedback = nil
        finalDiplomaName = ""
        finalDiplomaNameError = ""
        finalDiplomaReady = false
        roundID = UUID()
        isPlaying = true
        return true
    }

    func answer(_ value: Int) async -> Bool {
        guard isPlaying, feedback == nil else { return false }
        let isCorrect = value == question.correct
        if isCorrect {
            let streakBeforeReset = currentStreak + 1
            let damage = GameEngine.bossDamage(for: streakBeforeReset)
            let nextLives = max(0, bossLives - damage)
            bossLives = nextLives
            currentStreak = streakBeforeReset >= 5 ? 0 : streakBeforeReset
            bestStreak = max(bestStreak, streakBeforeReset)
            correctAnswers += 1
            feedback = .correct
            bossHit = true
            damageText = damage > 1 ? "-2 SUPER!" : "-1"
            message = damage > 1 ? "Superangrep! \(boss.name) mistet 2 liv." : "Riktig! \(boss.name) mistet 1 liv."
            try? await Task.sleep(nanoseconds: 420_000_000)
            bossHit = false
            damageText = nil
            if nextLives <= 0 {
                isPlaying = false
                outcome = .won
                unlockNextBoss()
                feedback = nil
                return true
            }
            question = nextQuestion()
            feedback = nil
            return false
        }

        let nextHearts = max(0, playerHearts - 1)
        playerHearts = nextHearts
        currentStreak = 0
        wrongAnswers += 1
        feedback = .wrong
        playerHit = true
        message = "Feil! \(boss.name) bruker \(GameEngine.bossAttackName(for: boss.id)) Du mister 1 hjerte."
        try? await Task.sleep(nanoseconds: 720_000_000)
        playerHit = false
        if nextHearts <= 0 {
            isPlaying = false
            outcome = .lost
            feedback = nil
            return true
        }
        question = nextQuestion()
        feedback = nil
        return false
    }

    func resetLadder() {
        localStore.resetBossUnlocks()
        unlocks = [:]
        bossId = "slime"
        resetMessage = "Boss-stigen er nullstilt."
    }

    func showFinalDiploma() {
        let cleanName = PlayerNameValidator.normalize(finalDiplomaName)
        if let validation = PlayerNameValidator.validate(cleanName) {
            finalDiplomaNameError = validation
            return
        }
        finalDiplomaName = cleanName
        finalDiplomaNameError = ""
        finalDiplomaReady = true
    }

    private func nextQuestion() -> Question {
        if deck.isEmpty {
            deck = GameEngine.createQuestionDeck(mode: mode, level: level)
        }
        return deck.removeLast()
    }

    private func unlockNextBoss() {
        let nextKey: String?
        switch boss.id {
        case "shadow": nextKey = "isdragen"
        case "isdragen": nextKey = "lavakjempen"
        case "lavakjempen": nextKey = "stormornen"
        case "stormornen": nextKey = "krystallvokteren"
        case "krystallvokteren": nextKey = "mekamaskinen"
        case "mekamaskinen": nextKey = "morkekraken"
        case "morkekraken": nextKey = "regnemesteren"
        default: nextKey = nil
        }
        guard let nextKey else { return }
        unlocks[nextKey] = true
        localStore.saveBossUnlocks(unlocks)
    }
}
