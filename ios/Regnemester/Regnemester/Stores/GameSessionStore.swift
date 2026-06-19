import Foundation
import Observation

@MainActor
@Observable
final class GameSessionStore {
    var gameType: GameType = .normal
    var mode: GameMode = .addition
    var level: GameLevel = .medium
    var gradeLevel = 4
    var questionCount = 10
    var normalTimed = true
    var playerName = ""
    var nameError = ""
    var school = ""
    var schoolGradeLevel = 4
    var schoolGradeGroup: GradeGroup = .small

    var roundID = UUID()
    var isPlaying = false
    var deck: [Question] = []
    var question = GameEngine.makeQuestion(mode: .addition, level: .medium)
    var feedback: AnswerFeedback?
    var score = 0
    var timeLeft = RegnemesterConstants.normalGameSeconds
    var elapsedSeconds = 0
    var wrongAnswers = 0
    var questionsDone = 0
    var normalCorrectCount = 0
    var normalWrongCount = 0
    var normalCurrentStreak = 0
    var normalBestStreak = 0
    var result: RoundResult?
    var resultScores: [ScoreEntry] = []
    var scoreMessage = ""
    var normalHighscoreName = ""
    var normalHighscoreMessage = ""
    var normalHighscoreSaving = false
    var normalHighscoreSubmitted = false

    @ObservationIgnored private var highscoreService: HighscoreService
    @ObservationIgnored private var adminService: AdminService

    init(highscoreService: HighscoreService, adminService: AdminService) {
        self.highscoreService = highscoreService
        self.adminService = adminService
    }

    var isNormalUntimedRound: Bool {
        gameType == .normal && !normalTimed
    }

    var isCurrentTimeChallenge: Bool {
        mode.isTimeChallenge && !isNormalUntimedRound
    }

    var activeQuestionCount: Int {
        gameType == .schoolBattle && mode.isTimeChallenge ? RegnemesterConstants.schoolBattleTimeQuestionCount : questionCount
    }

    var displayedTime: Int {
        isCurrentTimeChallenge ? elapsedSeconds + wrongAnswers * RegnemesterConstants.timePenaltySeconds : timeLeft
    }

    func configureNormal(mode: GameMode) {
        gameType = .normal
        self.mode = mode
        level = .medium
        gradeLevel = 4
        questionCount = 10
        normalTimed = true
        nameError = ""
        scoreMessage = ""
    }

    func configureSchoolBattle() {
        gameType = .schoolBattle
        level = .medium
        questionCount = RegnemesterConstants.schoolBattleTimeQuestionCount
        school = ""
        schoolGradeLevel = 4
        schoolGradeGroup = .small
        nameError = ""
        scoreMessage = ""
    }

    func selectSchool(_ school: String) {
        self.school = school
    }

    func selectSchoolGrade(_ grade: Int) {
        schoolGradeLevel = grade
        schoolGradeGroup = GradeGroup.group(for: grade)
    }

    func startRound() async -> Bool {
        if gameType == .schoolBattle {
            do {
                let open = try await adminService.loadSchoolBattleEnabled(fallback: true)
                guard open else {
                    nameError = "Skolekampen er for øyeblikket stengt."
                    scoreMessage = "Skolekampen er for øyeblikket stengt."
                    return false
                }
            } catch {
                nameError = error.localizedDescription
                return false
            }

            let cleanName = PlayerNameValidator.normalize(playerName)
            if let validation = PlayerNameValidator.validate(cleanName) {
                nameError = validation
                return false
            }
            playerName = cleanName
        }

        resetRoundState()
        deck = GameEngine.createQuestionDeck(mode: mode, level: level, gradeGroup: gameType == .schoolBattle ? schoolGradeGroup : nil)
        question = nextQuestion()
        roundID = UUID()
        isPlaying = true
        return true
    }

    func tick() async -> Bool {
        guard isPlaying else { return false }
        if isNormalUntimedRound { return false }
        if isCurrentTimeChallenge {
            elapsedSeconds += 1
            return false
        }
        timeLeft -= 1
        if timeLeft <= 0 {
            await finishRound()
            return true
        }
        return false
    }

    func answer(_ value: Int) async -> Bool {
        guard isPlaying, feedback == nil else { return false }
        let correct = value == question.correct
        recordNormalAnswer(correct)
        feedback = correct ? .correct : .wrong

        if isCurrentTimeChallenge {
            let nextCorrect = correct ? score + 1 : score
            let nextWrong = correct ? wrongAnswers : wrongAnswers + 1
            score = nextCorrect
            questionsDone = nextCorrect
            wrongAnswers = nextWrong
            let finalTime = elapsedSeconds + nextWrong * RegnemesterConstants.timePenaltySeconds
            try? await Task.sleep(nanoseconds: 180_000_000)
            if nextCorrect >= activeQuestionCount {
                await finishRound(scoreOverride: nextCorrect, wrongOverride: nextWrong, timeOverride: finalTime)
                return true
            }
            question = nextQuestion()
            feedback = nil
            return false
        }

        if correct {
            score += 1
        } else {
            score = max(0, score - 1)
        }
        try? await Task.sleep(nanoseconds: 180_000_000)
        question = nextQuestion()
        feedback = nil
        return false
    }

    func quitRound() async -> Bool {
        if gameType == .normal && !normalTimed {
            await finishRound()
            return true
        }
        isPlaying = false
        feedback = nil
        score = 0
        timeLeft = gameSeconds
        elapsedSeconds = 0
        questionsDone = 0
        wrongAnswers = 0
        resultScores = []
        return false
    }

    func finishRound(scoreOverride: Int? = nil, wrongOverride: Int? = nil, timeOverride: Int? = nil) async {
        isPlaying = false
        feedback = nil
        let finalScore = scoreOverride ?? score
        let finalWrong = wrongOverride ?? wrongAnswers
        let finalTime = timeOverride ?? elapsedSeconds + finalWrong * RegnemesterConstants.timePenaltySeconds
        let finalCorrect = isCurrentTimeChallenge ? finalScore : normalCorrectCount
        let finalNormalWrong = isCurrentTimeChallenge ? finalWrong : normalWrongCount
        let accuracyTotal = finalCorrect + finalNormalWrong
        let accuracy = accuracyTotal > 0 ? Int((Double(finalCorrect) / Double(accuracyTotal) * 100).rounded()) : 0
        var highscoreMessage = ""

        if gameType == .schoolBattle {
            do {
                let open = try await adminService.loadSchoolBattleEnabled(fallback: true)
                if !open {
                    highscoreMessage = "Skolekampen ble stengt før runden var ferdig.\nResultatet ble derfor ikke lagret."
                } else {
                    let kind: ScoreKind = isCurrentTimeChallenge ? .schoolBattleTime : .schoolBattleScore
                    let entry = ScoreEntry(
                        id: nil,
                        name: playerName,
                        score: isCurrentTimeChallenge ? finalTime : finalScore,
                        mode: mode,
                        level: .medium,
                        gradeLevel: schoolGradeLevel,
                        gameType: .schoolBattle,
                        questionCount: isCurrentTimeChallenge ? RegnemesterConstants.schoolBattleTimeQuestionCount : 0,
                        school: school,
                        gradeGroup: schoolGradeGroup
                    )
                    let saveResult = await highscoreService.saveWithPendingRetry(kind: kind, entry: entry)
                    highscoreMessage = "\(isCurrentTimeChallenge ? "Du brukte \(formattedTime(finalTime))." : "Du fikk \(finalScore) poeng.") \(saveResult.message)"
                    resultScores = (try? await highscoreService.loadSchoolBattleScores(mode: mode, gradeGroup: schoolGradeGroup, limit: RegnemesterConstants.schoolBattleVisibleFetchLimit)) ?? []
                }
            } catch {
                highscoreMessage = error.localizedDescription
            }
        } else {
            highscoreMessage = GameEngine.normalResultFeedback(accuracy: accuracy)
        }

        scoreMessage = highscoreMessage
        result = RoundResult(
            gameType: gameType,
            mode: mode,
            level: level,
            gradeLevel: gradeLevel,
            questionCount: activeQuestionCount,
            score: finalScore,
            correctAnswers: finalCorrect,
            wrongAnswers: finalNormalWrong,
            timeSeconds: finalTime,
            bestStreak: normalBestStreak,
            school: school,
            gradeGroup: schoolGradeGroup,
            message: GameEngine.message(for: finalScore),
            highscoreMessage: highscoreMessage
        )
    }

    func saveNormalHighscore() async {
        guard gameType == .normal, let result, !normalHighscoreSaving, !normalHighscoreSubmitted else { return }
        let cleanName = PlayerNameValidator.normalize(normalHighscoreName)
        if let validation = PlayerNameValidator.validate(cleanName) {
            normalHighscoreMessage = validation
            return
        }

        normalHighscoreName = cleanName
        normalHighscoreSaving = true
        defer { normalHighscoreSaving = false }

        let timedResult = mode.isTimeChallenge && normalTimed
        let entry = ScoreEntry(
            id: nil,
            name: cleanName,
            score: timedResult ? result.timeSeconds : result.score,
            mode: mode,
            level: level,
            gradeLevel: gradeLevel,
            gameType: .normal,
            questionCount: timedResult ? result.questionCount : 0
        )
        let kind: ScoreKind = timedResult ? .normalTime : .normalScore
        let saveResult = await highscoreService.saveWithPendingRetry(kind: kind, entry: entry)
        normalHighscoreMessage = saveResult.message
        normalHighscoreSubmitted = true
    }

    private var gameSeconds: Int {
        gameType == .schoolBattle ? RegnemesterConstants.schoolBattleSeconds : RegnemesterConstants.normalGameSeconds
    }

    private func nextQuestion() -> Question {
        if deck.isEmpty {
            deck = GameEngine.createQuestionDeck(mode: mode, level: level, gradeGroup: gameType == .schoolBattle ? schoolGradeGroup : nil)
        }
        return deck.removeLast()
    }

    private func resetRoundState() {
        nameError = ""
        scoreMessage = ""
        resultScores = []
        result = nil
        normalHighscoreMessage = ""
        normalHighscoreSaving = false
        normalHighscoreSubmitted = false
        score = 0
        timeLeft = gameSeconds
        elapsedSeconds = 0
        questionsDone = 0
        wrongAnswers = 0
        normalCorrectCount = 0
        normalWrongCount = 0
        normalCurrentStreak = 0
        normalBestStreak = 0
        feedback = nil
    }

    private func recordNormalAnswer(_ correct: Bool) {
        guard gameType == .normal else { return }
        if correct {
            let nextStreak = normalCurrentStreak + 1
            normalCorrectCount += 1
            normalCurrentStreak = nextStreak
            normalBestStreak = max(normalBestStreak, nextStreak)
        } else {
            normalWrongCount += 1
            normalCurrentStreak = 0
        }
    }
}
