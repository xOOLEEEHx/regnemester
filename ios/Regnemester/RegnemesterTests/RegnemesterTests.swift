import XCTest
@testable import Regnemester

final class RegnemesterTests: XCTestCase {
    func testAdditionQuestionsStayInsideLevelRange() {
        for _ in 0..<100 {
            let question = GameEngine.makeAdditionQuestion(level: .easy)
            XCTAssertEqual(question.correct, question.a + question.b)
            XCTAssertLessThanOrEqual(question.correct, 20)
            XCTAssertEqual(Set(question.options).count, 4)
            XCTAssertTrue(question.options.contains(question.correct))
        }
    }

    func testSubtractionNeverGoesNegative() {
        for _ in 0..<100 {
            let question = GameEngine.makeSubtractionQuestion(level: .hard)
            XCTAssertGreaterThanOrEqual(question.correct, 0)
            XCTAssertEqual(question.correct, question.a - question.b)
            XCTAssertTrue(question.options.contains(question.correct))
        }
    }

    func testDivisionQuestionsUseWholeNumberAnswers() {
        for _ in 0..<100 {
            let question = GameEngine.makeDivisionQuestion(divisor: 6, answer: 7, max: 10)
            XCTAssertEqual(question.a, 42)
            XCTAssertEqual(question.b, 6)
            XCTAssertEqual(question.correct, 7)
            XCTAssertTrue(question.options.contains(7))
        }
    }

    func testSchoolBattleGradeGroups() {
        XCTAssertEqual(GradeGroup.group(for: 1), .small)
        XCTAssertEqual(GradeGroup.group(for: 4), .small)
        XCTAssertEqual(GradeGroup.group(for: 5), .middle)
        XCTAssertEqual(GradeGroup.group(for: 7), .middle)
    }

    func testPlayerNameValidation() {
        XCTAssertNil(PlayerNameValidator.validate("Tiger 23"))
        XCTAssertNotNil(PlayerNameValidator.validate("x"))
        XCTAssertNotNil(PlayerNameValidator.validate("dum"))
        XCTAssertNotNil(PlayerNameValidator.validate("Navn_med_tegn"))
    }

    func testTimedScoresSortAscendingAndDedupeByPlayer() {
        let scores = [
            ScoreEntry(id: "1", name: "Ada", score: 40, mode: .addition, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 10),
            ScoreEntry(id: "2", name: "Ada", score: 35, mode: .addition, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 10),
            ScoreEntry(id: "3", name: "Bo", score: 50, mode: .addition, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 10)
        ]
        let ranked = ScoreRanking.dedupeNormal(scores, mode: .addition)
        XCTAssertEqual(ranked.map(\.id), ["2", "3"])
    }

    func testScoreScoresSortDescendingAndDedupeByPlayer() {
        let scores = [
            ScoreEntry(id: "1", name: "Ada", score: 10, mode: .multiplication, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 0),
            ScoreEntry(id: "2", name: "Ada", score: 14, mode: .multiplication, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 0),
            ScoreEntry(id: "3", name: "Bo", score: 12, mode: .multiplication, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 0)
        ]
        let ranked = ScoreRanking.dedupeNormal(scores, mode: .multiplication)
        XCTAssertEqual(ranked.map(\.id), ["2", "3"])
    }

    func testBossUnlockDefaults() {
        let unlocked = BossDefinition.all.filter { $0.isUnlocked(with: [:]) }.map(\.id)
        XCTAssertEqual(unlocked, ["slime", "troll", "shadow"])
        XCTAssertTrue(BossDefinition.all.first { $0.id == "isdragen" }?.isUnlocked(with: ["isdragen": true]) == true)
    }

    func testBossDamageUsesSuperAttackOnFiveStreak() {
        XCTAssertEqual(GameEngine.bossDamage(for: 4), 1)
        XCTAssertEqual(GameEngine.bossDamage(for: 5), 2)
    }

    func testPendingHighscoreQueueStoresUpdatesAndRemovesItems() {
        let defaults = makeIsolatedDefaults()
        let store = LocalStore(defaults: defaults)
        let entry = ScoreEntry(id: nil, name: "Ada", score: 12, mode: .multiplication, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 0)

        let pending = store.queuePending(kind: .normalScore, entry: entry)
        XCTAssertEqual(store.loadPendingHighscores().count, 1)

        let updated = store.updatePending(pending.id) { item in
            item.attemptCount += 1
        }
        XCTAssertEqual(updated?.attemptCount, 1)

        store.removePending(pending.id)
        XCTAssertTrue(store.loadPendingHighscores().isEmpty)
    }

    func testLocalHighscoreServiceKeepsBestNormalScorePerPlayer() async throws {
        let defaults = makeIsolatedDefaults()
        let store = LocalStore(defaults: defaults)
        let service = HighscoreService(rest: nil, localStore: store)
        let best = ScoreEntry(id: nil, name: "Ada", score: 18, mode: .multiplication, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 0)
        let worse = ScoreEntry(id: nil, name: "Ada", score: 12, mode: .multiplication, level: .medium, gradeLevel: 4, gameType: .normal, questionCount: 0)

        let bestResult = try await service.save(kind: .normalScore, entry: best)
        let worseResult = try await service.save(kind: .normalScore, entry: worse)
        XCTAssertTrue(bestResult.saved)
        XCTAssertFalse(worseResult.saved)

        let stored = store.loadScores()
        XCTAssertEqual(stored.count, 1)
        XCTAssertEqual(stored.first?.score, 18)
    }

    private func makeIsolatedDefaults() -> UserDefaults {
        let suiteName = "RegnemesterTests-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        return defaults
    }
}
