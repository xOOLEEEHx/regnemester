import Observation
import SwiftUI

struct HomeView: View {
    @Bindable var app: AppModel

    var body: some View {
        GameShell(theme: .plain) {
            BundleImage(path: "branding/regnemester-logo-startside.png")
                .frame(maxWidth: 360)
                .frame(height: 148)
                .padding(.top, 2)

            Text("Bli trygg på regning gjennom raske runder, skolekamp og bosskamper.")
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center)
                .foregroundStyle(Color(hex: "#334155"))
                .padding(.horizontal)

            VStack(spacing: 14) {
                ModeCard(title: "Normal", subtitle: "Øv alene i ditt tempo", imagePath: "cards/normal-card-bg.png", color: Color(hex: "#2563eb")) {
                    app.session.configureNormal(mode: .addition)
                    app.navigate(.normalMode)
                }
                ModeCard(title: "Skolekampen", subtitle: "Konkurrer for skolen din", imagePath: "cards/school-battle-card-bg.png", color: Color(hex: "#f97316"), disabled: !app.schoolBattleEnabled) {
                    Task { await app.openSchoolBattle() }
                }
                ModeCard(title: "Boss Battle", subtitle: "Slå bossene med matte", imagePath: "cards/boss-battle-card-bg.png", color: Color(hex: "#be185d")) {
                    app.navigate(.bossMode)
                }
            }

            if !app.schoolBattleStatusMessage.isEmpty {
                Text(app.schoolBattleStatusMessage)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Color(hex: "#be123c"))
                    .padding()
                    .background(Color(hex: "#fff1f2"))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }

            HStack(spacing: 10) {
                SecondaryButton(title: "Highscore", systemImage: "crown") { app.navigate(.highscoreHome) }
                SecondaryButton(title: "QR-kode", systemImage: "qrcode") { app.navigate(.qr) }
                SecondaryButton(title: "Admin", systemImage: "shield") { app.navigate(.adminLogin) }
            }
        }
        .task {
            await app.refreshSchoolBattleStatus()
            await app.refreshAnnouncementSettings()
        }
    }
}

struct ModeSelectionView: View {
    @Bindable var app: AppModel
    var title: String
    var subtitle: String
    var modes: [GameMode]
    var select: (GameMode) -> Void

    var body: some View {
        GameShell(theme: title == "Boss Battle" ? .boss : title == "Skolekampen" ? .school : .normal) {
            HeroHeader(title: title, subtitle: subtitle, systemImage: title == "Boss Battle" ? "star.fill" : "bolt.fill", color: title == "Boss Battle" ? Color(hex: "#be185d") : Color(hex: "#2563eb"))
            Panel {
                ForEach(modes) { mode in
                    PrimaryButton(title: mode.label, systemImage: modeIcon(mode), color: title == "Skolekampen" ? Color(hex: "#f97316") : title == "Boss Battle" ? Color(hex: "#be185d") : Color(hex: "#2563eb")) {
                        select(mode)
                    }
                }
            }
        }
    }

    private func modeIcon(_ mode: GameMode) -> String {
        switch mode {
        case .addition: "plus"
        case .subtraction: "minus"
        case .multiplication: "multiply"
        case .division: "divide"
        case .mixed: "shuffle"
        }
    }
}

struct SchoolSelectionView: View {
    @Bindable var app: AppModel

    var body: some View {
        GameShell(theme: .school) {
            HeroHeader(title: "Skolekampen", subtitle: "Velg skole.", systemImage: "trophy.fill", color: Color(hex: "#f97316"))
            Panel {
                ForEach(RegnemesterConstants.schools, id: \.self) { school in
                    PrimaryButton(title: school, systemImage: "building.2.fill", color: Color(hex: "#f97316")) {
                        app.session.selectSchool(school)
                        app.navigate(.schoolClass)
                    }
                }
            }
        }
    }
}

struct SchoolClassView: View {
    @Bindable var app: AppModel

    var body: some View {
        GameShell(theme: .school) {
            HeroHeader(title: "Skolekampen", subtitle: app.session.school, systemImage: "person.3.fill", color: Color(hex: "#f97316"))
            Panel {
                ForEach(RegnemesterConstants.schoolBattleGradeOptions, id: \.self) { grade in
                    PrimaryButton(title: schoolBattleClassLabel(grade), systemImage: "graduationcap.fill", color: Color(hex: "#f97316")) {
                        app.session.selectSchoolGrade(grade)
                        app.navigate(.schoolMode)
                    }
                }
            }
        }
    }
}

struct QRView: View {
    @Bindable var app: AppModel
    private let appURL = "https://regnemester.vercel.app/"

    var body: some View {
        GameShell {
            HeroHeader(title: "QR-kode", subtitle: "Åpne Regnemester på nett.", systemImage: "qrcode", color: Color(hex: "#facc15"))
            Panel {
                Image(systemName: "qrcode")
                    .font(.system(size: 132, weight: .regular))
                    .foregroundStyle(Color(hex: "#0f172a"))
                Text(appURL)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: "#64748b"))
                SecondaryButton(title: "Til start", systemImage: "house.fill") { app.popToRoot() }
            }
        }
    }
}
