import Observation
import SwiftUI

struct HighscoreHomeView: View {
    @Bindable var app: AppModel

    var body: some View {
        GameShell {
            HeroHeader(title: "Highscore", subtitle: "Se topplistene.", systemImage: "crown.fill", color: Color(hex: "#facc15"))
            Panel {
                PrimaryButton(title: "Skolekampen", systemImage: "building.2.fill", color: Color(hex: "#f97316")) {
                    app.session.mode = .addition
                    app.navigate(.schoolHighscore)
                }
                SecondaryButton(title: "Normal", systemImage: "bolt.fill") {
                    app.session.mode = .addition
                    app.navigate(.normalHighscore)
                }
            }
        }
    }
}

struct SchoolHighscoreView: View {
    @Bindable var app: AppModel
    @State private var state: LoadState<[ScoreEntry]> = .idle
    @State private var selectedMode: GameMode = .addition
    @State private var gradeGroup: GradeGroup = .small

    var body: some View {
        GameShell(theme: .school) {
            HeroHeader(title: "Skolekampen", subtitle: selectedMode.isTimeChallenge ? "\(selectedMode.label) · \(gradeGroup.label) · Topp 20 korteste tider" : "\(selectedMode.label) · Topp 20", systemImage: "crown.fill", color: Color(hex: "#f97316"))
            HighscoreFilters(selectedMode: $selectedMode, gradeGroup: $gradeGroup, includeGradeGroup: selectedMode.isTimeChallenge, color: Color(hex: "#f97316"))

            highscoreContent
        }
        .task(id: "\(selectedMode.rawValue)-\(gradeGroup.rawValue)") {
            await loadScores()
        }
    }

    @ViewBuilder
    private var highscoreContent: some View {
        switch state {
        case .idle, .loading:
            ProgressView("Laster highscore...")
                .font(.system(size: 16, weight: .bold, design: .rounded))
        case .failed(let message):
            Text(message)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(Color(hex: "#be123c"))
        case .loaded(let scores):
            Panel {
                if scores.isEmpty {
                    Text("Ingen resultater ennå")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                    Text("Spill en runde i Skolekampen for å lage første score.")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(hex: "#64748b"))
                        .multilineTextAlignment(.center)
                } else {
                    ForEach(Array(ScoreRanking.dedupeSchoolBattle(scores, mode: selectedMode).enumerated()), id: \.element) { index, entry in
                        ScoreRow(rank: index + 1, entry: entry, timed: selectedMode.isTimeChallenge)
                    }
                }
            }
        }
    }

    private func loadScores() async {
        state = .loading
        do {
            let scores = try await app.highscoreService.loadSchoolBattleScores(mode: selectedMode, gradeGroup: gradeGroup, limit: RegnemesterConstants.schoolBattleVisibleFetchLimit)
            state = .loaded(scores)
        } catch {
            state = .failed("Highscore-listen kunne ikke lastes akkurat nå.")
        }
    }
}

struct NormalHighscoreView: View {
    @Bindable var app: AppModel
    @State private var state: LoadState<[ScoreEntry]> = .idle
    @State private var selectedMode: GameMode = .addition
    @State private var selectedLevel: GameLevel = .medium
    @State private var questionCount = 10
    @State private var gradeLevel = 4

    var body: some View {
        GameShell(theme: .normal) {
            HeroHeader(title: "Normal", subtitle: "\(selectedMode.label) · \(selectedLevel.label)", systemImage: "crown.fill", color: Color(hex: "#2563eb"))
            HighscoreFilters(selectedMode: $selectedMode, gradeGroup: .constant(.small), includeGradeGroup: false, color: Color(hex: "#2563eb"))
            Panel {
                Picker("Nivå", selection: $selectedLevel) {
                    ForEach(GameLevel.allCases) { level in Text(level.label).tag(level) }
                }
                .pickerStyle(.segmented)
                if selectedMode.isTimeChallenge {
                    Picker("Oppgaver", selection: $questionCount) {
                        ForEach(RegnemesterConstants.questionCountOptions, id: \.self) { count in Text("\(count)").tag(count) }
                    }
                    .pickerStyle(.segmented)
                }
            }
            content
        }
        .task(id: "\(selectedMode.rawValue)-\(selectedLevel.rawValue)-\(questionCount)-\(gradeLevel)") {
            await loadScores()
        }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .idle, .loading:
            ProgressView("Laster highscore...")
        case .failed(let message):
            Text(message).foregroundStyle(Color(hex: "#be123c"))
        case .loaded(let scores):
            Panel {
                if scores.isEmpty {
                    Text("Ingen resultater ennå")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                } else {
                    ForEach(Array(ScoreRanking.dedupeNormal(scores, mode: selectedMode).enumerated()), id: \.element) { index, entry in
                        ScoreRow(rank: index + 1, entry: entry, timed: selectedMode.isTimeChallenge)
                    }
                }
            }
        }
    }

    private func loadScores() async {
        state = .loading
        do {
            let scores = try await app.highscoreService.loadNormalScores(mode: selectedMode, level: selectedLevel, gradeLevel: gradeLevel, questionCount: questionCount, limit: RegnemesterConstants.normalVisibleFetchLimit)
            state = .loaded(scores)
        } catch {
            state = .failed("Highscore-listen kunne ikke lastes akkurat nå.")
        }
    }
}

struct HighscoreFilters: View {
    @Binding var selectedMode: GameMode
    @Binding var gradeGroup: GradeGroup
    var includeGradeGroup: Bool
    var color: Color

    var body: some View {
        Panel {
            ForEach(GameMode.schoolModes) { mode in
                PrimaryButton(title: mode.label, systemImage: selectedMode == mode ? "checkmark.circle.fill" : "circle", color: selectedMode == mode ? color : Color(hex: "#64748b")) {
                    selectedMode = mode
                }
            }
            if includeGradeGroup {
                HStack {
                    ForEach(GradeGroup.allCases) { group in
                        PrimaryButton(title: group.label, systemImage: gradeGroup == group ? "checkmark.circle.fill" : "person.3", color: gradeGroup == group ? color : Color(hex: "#64748b")) {
                            gradeGroup = group
                        }
                    }
                }
            }
        }
    }
}
