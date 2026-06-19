import Observation
import SwiftUI

struct StartRoundView: View {
    @Bindable var app: AppModel

    var body: some View {
        StartRoundContent(app: app, session: app.session)
    }
}

struct StartRoundContent: View {
    @Bindable var app: AppModel
    @Bindable var session: GameSessionStore

    private var theme: ShellTheme {
        session.gameType == .schoolBattle ? .school : .normal
    }

    var body: some View {
        GameShell(theme: theme) {
            HeroHeader(
                title: session.gameType == .schoolBattle ? "Skolekampen" : "Regnemester",
                subtitle: subtitle,
                systemImage: session.gameType == .schoolBattle ? "trophy.fill" : "bolt.fill",
                color: theme.primary
            )

            if session.gameType == .normal {
                Panel {
                    Text("Velg nivå")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                    ForEach(GameLevel.allCases) { level in
                        PrimaryButton(title: level.label, systemImage: session.level == level ? "checkmark.circle.fill" : "circle", color: session.level == level ? theme.primary : Color(hex: "#64748b")) {
                            session.level = level
                        }
                    }
                }

                if session.mode.isTimeChallenge {
                    Panel {
                        Text("Rundetype")
                            .font(.system(size: 18, weight: .black, design: .rounded))
                        HStack {
                            PrimaryButton(title: "På tid", systemImage: session.normalTimed ? "checkmark.circle.fill" : "timer", color: session.normalTimed ? theme.primary : Color(hex: "#64748b")) {
                                session.normalTimed = true
                            }
                            PrimaryButton(title: "Uten tid", systemImage: !session.normalTimed ? "checkmark.circle.fill" : "infinity", color: !session.normalTimed ? theme.primary : Color(hex: "#64748b")) {
                                session.normalTimed = false
                            }
                        }
                        if session.normalTimed {
                            ForEach(RegnemesterConstants.questionCountOptions, id: \.self) { count in
                                PrimaryButton(title: "\(count) oppgaver", systemImage: session.questionCount == count ? "checkmark.circle.fill" : "number", color: session.questionCount == count ? theme.primary : Color(hex: "#64748b")) {
                                    session.questionCount = count
                                }
                            }
                        }
                    }
                }
            } else {
                Panel {
                    Text("\(session.school) · \(schoolBattleClassLabel(session.schoolGradeLevel))")
                        .font(.system(size: 17, weight: .black, design: .rounded))
                        .multilineTextAlignment(.center)
                    Text(session.mode.isTimeChallenge ? "25 riktige svar · feil gir +\(RegnemesterConstants.timePenaltySeconds) sekunder" : "Middels nivå · 70 sekunder")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(hex: "#64748b"))
                    TextField("f.eks. Tiger23", text: $session.playerName)
                        .textInputAutocapitalization(.words)
                        .autocorrectionDisabled()
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .multilineTextAlignment(.center)
                        .padding()
                        .background(Color(hex: "#f8fafc"))
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
            }

            if !session.nameError.isEmpty {
                Text(session.nameError)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: "#be123c"))
                    .multilineTextAlignment(.center)
            }

            PrimaryButton(title: "Start spillet", systemImage: "play.fill", color: theme.primary, disabled: session.gameType == .schoolBattle && PlayerNameValidator.normalize(session.playerName).isEmpty) {
                Task {
                    if await session.startRound() {
                        app.navigate(.play)
                    }
                }
            }
        }
    }

    private var subtitle: String {
        if session.gameType == .schoolBattle {
            return "\(session.mode.label) · \(schoolBattleClassLabel(session.schoolGradeLevel))"
        }
        return GameEngine.levelDescription(mode: session.mode, level: session.level)
    }
}

struct PlayView: View {
    @Bindable var app: AppModel

    var body: some View {
        PlayContent(app: app, session: app.session)
    }
}

struct PlayContent: View {
    @Bindable var app: AppModel
    @Bindable var session: GameSessionStore

    private var theme: ShellTheme {
        session.gameType == .schoolBattle ? .school : .normal
    }

    var body: some View {
        GameShell(theme: theme) {
            HStack(spacing: 10) {
                StatusPill(systemImage: "timer", value: session.isNormalUntimedRound ? "Uten tid" : session.isCurrentTimeChallenge ? formattedTime(session.displayedTime) : "\(session.timeLeft) sek", color: Color(hex: "#e11d48"))
                StatusPill(systemImage: "trophy.fill", value: session.isCurrentTimeChallenge ? "\(session.questionsDone)/\(session.activeQuestionCount)" : "\(session.score) poeng", color: Color(hex: "#059669"))
            }

            QuestionCard(question: session.question, label: session.isCurrentTimeChallenge ? "Oppgave \(min(session.questionsDone + 1, session.activeQuestionCount)) av \(session.activeQuestionCount)" : "Velg riktig svar", theme: theme)

            AnswerGrid(options: session.question.options, correct: session.question.correct, feedback: session.feedback, theme: theme) { value in
                Task {
                    if await session.answer(value) {
                        app.navigate(.result)
                    }
                }
            }

            Text(feedbackText)
                .font(.system(size: 21, weight: .black, design: .rounded))
                .foregroundStyle(feedbackColor)
                .frame(minHeight: 34)

            SecondaryButton(title: "Avslutt runde", systemImage: "xmark.circle.fill") {
                Task {
                    if await session.quitRound() {
                        app.navigate(.result)
                    } else {
                        app.replaceStack(with: session.gameType == .schoolBattle ? .schoolMode : .normalMode)
                    }
                }
            }
        }
        .task(id: session.roundID) {
            while session.isPlaying {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if await session.tick() {
                    app.navigate(.result)
                    break
                }
            }
        }
    }

    private var feedbackText: String {
        switch session.feedback {
        case .correct: "Riktig! +1"
        case .wrong: session.isCurrentTimeChallenge ? "Feil! +\(RegnemesterConstants.timePenaltySeconds) sekunder." : "Feil! -1 poeng"
        case nil: session.isNormalUntimedRound ? "Øv rolig uten tidspress!" : session.isCurrentTimeChallenge ? "Svar riktig og raskt!" : "Svar så raskt du kan!"
        }
    }

    private var feedbackColor: Color {
        switch session.feedback {
        case .correct: Color(hex: "#059669")
        case .wrong: Color(hex: "#e11d48")
        case nil: Color(hex: "#64748b")
        }
    }
}

struct ResultView: View {
    @Bindable var app: AppModel

    private var session: GameSessionStore {
        app.session
    }

    private var result: RoundResult? {
        session.result
    }

    private var theme: ShellTheme {
        session.gameType == .schoolBattle ? .school : .normal
    }

    var body: some View {
        GameShell(theme: theme) {
            HeroHeader(title: session.isCurrentTimeChallenge ? "Ferdig!" : "Runden er ferdig!", subtitle: result?.highscoreMessage ?? "", systemImage: "trophy.fill", color: theme.primary)

            Panel {
                Text(session.isCurrentTimeChallenge ? "Din tid" : "Du fikk")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundStyle(Color(hex: "#64748b"))
                Text(session.isCurrentTimeChallenge ? formattedTime(result?.timeSeconds ?? 0) : "\(result?.score ?? 0)")
                    .font(.system(size: 62, weight: .black, design: .rounded))
                    .foregroundStyle(Color(hex: "#059669"))
                    .minimumScaleFactor(0.55)
                if !session.isCurrentTimeChallenge {
                    StarsView(count: result?.stars ?? 1)
                }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ResultStat(title: "Riktige", value: "\(result?.correctAnswers ?? 0)")
                    ResultStat(title: "Feil", value: "\(result?.wrongAnswers ?? 0)")
                    ResultStat(title: "Treff", value: "\(result?.accuracy ?? 0)%")
                    ResultStat(title: "Beste rekke", value: "\(result?.bestStreak ?? 0)")
                }
            }

            if session.gameType == .schoolBattle && !session.resultScores.isEmpty {
                ResultHighscoreList(scores: session.resultScores, mode: session.mode)
            }

            if session.gameType == .normal {
                NormalHighscoreSavePanel(session: session)
            }

            PrimaryButton(title: session.gameType == .schoolBattle ? "Spill igjen" : "Prøv igjen", systemImage: "arrow.clockwise", color: theme.primary) {
                Task {
                    if await session.startRound() {
                        app.replaceStack(with: .play)
                    }
                }
            }
            SecondaryButton(title: "Til meny", systemImage: "house.fill") {
                app.popToRoot()
            }
        }
    }
}

struct StatusPill: View {
    var systemImage: String
    var value: String
    var color: Color

    var body: some View {
        HStack {
            Image(systemName: systemImage)
            Text(value)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .font(.system(size: 17, weight: .black, design: .rounded))
        .foregroundStyle(color)
        .frame(maxWidth: .infinity)
        .padding(14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
        .shadow(color: .black.opacity(0.06), radius: 10, y: 5)
    }
}

struct StarsView: View {
    var count: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<max(1, count), id: \.self) { _ in
                Image(systemName: "star.fill")
                    .font(.title2)
                    .foregroundStyle(Color(hex: "#facc15"))
            }
        }
    }
}

struct ResultStat: View {
    var title: String
    var value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 24, weight: .black, design: .rounded))
            Text(title)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(Color(hex: "#64748b"))
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(hex: "#f8fafc"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

struct NormalHighscoreSavePanel: View {
    @Bindable var session: GameSessionStore

    var body: some View {
        Panel {
            Text("Highscore")
                .font(.system(size: 20, weight: .black, design: .rounded))
            TextField("Spillnavn", text: $session.normalHighscoreName)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled()
                .font(.system(size: 20, weight: .black, design: .rounded))
                .multilineTextAlignment(.center)
                .padding()
                .background(Color(hex: "#f8fafc"))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            PrimaryButton(
                title: session.normalHighscoreSubmitted ? "Highscore sjekket" : session.normalHighscoreSaving ? "Lagrer..." : "Lagre på highscore",
                systemImage: session.normalHighscoreSubmitted ? "checkmark.circle.fill" : "crown.fill",
                color: Color(hex: "#2563eb"),
                disabled: session.normalHighscoreSaving || session.normalHighscoreSubmitted || PlayerNameValidator.normalize(session.normalHighscoreName).isEmpty
            ) {
                Task { await session.saveNormalHighscore() }
            }
            if !session.normalHighscoreMessage.isEmpty {
                Text(session.normalHighscoreMessage)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: session.normalHighscoreSubmitted ? "#059669" : "#be123c"))
                    .multilineTextAlignment(.center)
            }
        }
    }
}

struct ResultHighscoreList: View {
    var scores: [ScoreEntry]
    var mode: GameMode

    var body: some View {
        Panel {
            Text("Highscore")
                .font(.system(size: 20, weight: .black, design: .rounded))
            ForEach(Array(ScoreRanking.dedupeSchoolBattle(scores, mode: mode).enumerated()), id: \.element) { index, entry in
                ScoreRow(rank: index + 1, entry: entry, timed: mode.isTimeChallenge)
            }
        }
    }
}
