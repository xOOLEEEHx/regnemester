import Observation
import SwiftUI

struct BossSelectView: View {
    @Bindable var app: AppModel

    var body: some View {
        BossSelectContent(app: app, bossStore: app.boss)
    }
}

struct BossSelectContent: View {
    @Bindable var app: AppModel
    @Bindable var bossStore: BossBattleStore

    var body: some View {
        GameShell(theme: .boss) {
            HeroHeader(title: "Boss Battle", subtitle: "\(bossStore.mode.label) · velg boss.", systemImage: "star.fill", color: Color(hex: "#be185d"))
            Panel {
                Picker("Nivå", selection: $bossStore.level) {
                    ForEach(GameLevel.allCases) { level in Text(level.label).tag(level) }
                }
                .pickerStyle(.segmented)
            }
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 156), spacing: 12)], spacing: 12) {
                ForEach(BossDefinition.all) { boss in
                    BossChoiceCard(boss: boss, unlocked: bossStore.isUnlocked(boss), selected: bossStore.bossId == boss.id) {
                        if bossStore.isUnlocked(boss) {
                            bossStore.bossId = boss.id
                        }
                    }
                }
            }
            PrimaryButton(title: "Start bosskamp", systemImage: "play.fill", color: Color(hex: "#be185d"), disabled: !bossStore.isUnlocked(bossStore.boss)) {
                if bossStore.start() {
                    app.navigate(.bossPlay)
                }
            }
            SecondaryButton(title: "Nullstill boss-stige", systemImage: "arrow.counterclockwise") {
                bossStore.resetLadder()
            }
            if !bossStore.resetMessage.isEmpty {
                Text(bossStore.resetMessage)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: "#64748b"))
            }
        }
    }
}

struct BossChoiceCard: View {
    var boss: BossDefinition
    var unlocked: Bool
    var selected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                BundleImage(path: boss.imagePath(for: .idle))
                    .frame(height: 118)
                    .shadow(color: Color(hex: boss.accentHex).opacity(0.35), radius: 12, y: 8)
                Text(boss.name)
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .multilineTextAlignment(.center)
                Text(unlocked ? "\(boss.lives) liv" : (boss.lockedText ?? "Låst"))
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: "#64748b"))
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(12)
            .background(.white.opacity(unlocked ? 0.96 : 0.62))
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(selected ? Color(hex: boss.accentHex) : Color(hex: "#e2e8f0"), lineWidth: selected ? 3 : 1)
            }
        }
        .buttonStyle(.plain)
        .disabled(!unlocked)
    }
}

struct BossPlayView: View {
    @Bindable var app: AppModel

    var body: some View {
        BossPlayContent(app: app, bossStore: app.boss)
    }
}

struct BossPlayContent: View {
    @Bindable var app: AppModel
    @Bindable var bossStore: BossBattleStore

    var body: some View {
        GameShell(theme: .boss) {
            BossArenaView(bossStore: bossStore)
            Panel {
                HStack {
                    Text(String(repeating: "♥", count: bossStore.playerHearts))
                        .foregroundStyle(Color(hex: "#e11d48"))
                        .font(.system(size: 24, weight: .black, design: .rounded))
                    Spacer()
                    Text("Super \(bossStore.currentStreak)/5")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundStyle(bossStore.isSuperReady ? Color(hex: "#facc15") : Color(hex: "#64748b"))
                }
            }
            QuestionCard(question: bossStore.question, label: "Velg riktig svar", theme: .boss)
            AnswerGrid(options: bossStore.question.options, correct: bossStore.question.correct, feedback: bossStore.feedback, theme: .boss) { value in
                Task {
                    if await bossStore.answer(value) {
                        app.navigate(.bossResult)
                    }
                }
            }
            Text(bossStore.message)
                .font(.system(size: 17, weight: .black, design: .rounded))
                .multilineTextAlignment(.center)
                .foregroundStyle(Color(hex: "#334155"))
            SecondaryButton(title: "Avslutt bosskamp", systemImage: "xmark.circle.fill") {
                bossStore.isPlaying = false
                app.replaceStack(with: .bossSelect)
            }
        }
    }
}

struct BossArenaView: View {
    @Bindable var bossStore: BossBattleStore

    var body: some View {
        ZStack(alignment: .bottom) {
            BundleImage(path: bossStore.boss.panelBackgroundPath, contentMode: .fill)
                .frame(height: 260)
                .clipped()
                .overlay(Color.black.opacity(0.16))
            VStack(spacing: 6) {
                Text(bossStore.boss.arena)
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(.white.opacity(0.9))
                Text(bossStore.boss.name)
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                BundleImage(path: bossStore.boss.imagePath(for: bossStore.visualState))
                    .frame(height: 156)
                    .scaleEffect(bossStore.bossHit ? 1.08 : 1)
                if let damageText = bossStore.damageText {
                    Text(damageText)
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundStyle(Color(hex: "#facc15"))
                }
                VStack(spacing: 4) {
                    HStack {
                        Text("Boss-liv")
                        Spacer()
                        Text("\(bossStore.bossLives)/\(bossStore.bossMaxLives)")
                    }
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    ProgressView(value: bossStore.hpPercent, total: 100)
                        .tint(Color(hex: bossStore.boss.accentHex))
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 14)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
        .shadow(color: Color(hex: bossStore.boss.accentHex).opacity(0.22), radius: 18, y: 10)
    }
}

struct BossResultView: View {
    @Bindable var app: AppModel

    var body: some View {
        BossResultContent(app: app, bossStore: app.boss)
    }
}

struct BossResultContent: View {
    @Bindable var app: AppModel
    @Bindable var bossStore: BossBattleStore

    private var won: Bool {
        bossStore.outcome == .won
    }

    var body: some View {
        GameShell(theme: .boss) {
            HeroHeader(title: won ? "Du vant!" : "Prøv igjen!", subtitle: won ? "Du beseiret \(bossStore.boss.name)." : "\(bossStore.boss.name) står igjen.", systemImage: won ? "crown.fill" : "heart.slash.fill", color: Color(hex: "#be185d"))
            Panel {
                if won {
                    BundleImage(path: bossStore.boss.imagePath(for: .defeated))
                        .frame(height: 160)
                    Text(bossStore.boss.treasureName)
                        .font(.system(size: 24, weight: .black, design: .rounded))
                    if bossStore.boss.id == "regnemesteren" {
                        FinalDiplomaFormView(bossStore: bossStore)
                    }
                } else {
                    BundleImage(path: bossStore.boss.imagePath(for: .attack))
                        .frame(height: 160)
                    Text("\(bossStore.bossLives) boss-liv igjen")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                }
                HStack {
                    ResultStat(title: "Hjerter", value: "\(bossStore.playerHearts)/\(bossStore.playerMaxHearts)")
                    ResultStat(title: "Riktige", value: "\(bossStore.correctAnswers)")
                    ResultStat(title: "Feil", value: "\(bossStore.wrongAnswers)")
                }
            }
            PrimaryButton(title: "Prøv samme boss igjen", systemImage: "arrow.clockwise", color: Color(hex: "#be185d")) {
                if bossStore.start() {
                    app.replaceStack(with: .bossPlay)
                }
            }
            SecondaryButton(title: "Velg ny boss", systemImage: "star.fill") {
                app.replaceStack(with: .bossSelect)
            }
            SecondaryButton(title: "Til start", systemImage: "house.fill") {
                app.popToRoot()
            }
        }
    }
}

struct FinalDiplomaFormView: View {
    @Bindable var bossStore: BossBattleStore

    var body: some View {
        if bossStore.finalDiplomaReady {
            BundleImage(path: bossStore.boss.finalDiplomaPath)
                .frame(height: 180)
            Text("Diplom til \(bossStore.finalDiplomaName)")
                .font(.system(size: 22, weight: .black, design: .rounded))
                .multilineTextAlignment(.center)
        } else {
            TextField("Navn på diplomet", text: $bossStore.finalDiplomaName)
                .textFieldStyle(.roundedBorder)
                .multilineTextAlignment(.center)
            if !bossStore.finalDiplomaNameError.isEmpty {
                Text(bossStore.finalDiplomaNameError)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: "#be123c"))
            }
            PrimaryButton(title: "Lag diplom", systemImage: "doc.richtext.fill", color: Color(hex: "#be185d")) {
                bossStore.showFinalDiploma()
            }
        }
    }
}
