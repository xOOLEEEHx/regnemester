import Observation
import SwiftUI

struct AppRootView: View {
    @State private var app = AppModel()

    var body: some View {
        AppNavigationView(app: app)
    }
}

struct AppNavigationView: View {
    @Bindable var app: AppModel

    var body: some View {
        NavigationStack(path: $app.path) {
            HomeView(app: app)
                .navigationDestination(for: Route.self) { route in
                    destination(for: route)
                }
        }
        .sheet(item: $app.presentedSheet) { sheet in
            switch sheet {
            case .announcement:
                AnnouncementSheet(app: app)
            }
        }
        .task {
            await app.refreshStartup()
        }
    }

    @ViewBuilder
    private func destination(for route: Route) -> some View {
        switch route {
        case .normalMode:
            ModeSelectionView(app: app, title: "Normal", subtitle: "Velg regneart.", modes: GameMode.practiceModes) { mode in
                app.session.configureNormal(mode: mode)
                app.navigate(.start)
            }
        case .school:
            SchoolSelectionView(app: app)
        case .schoolClass:
            SchoolClassView(app: app)
        case .schoolMode:
            ModeSelectionView(app: app, title: "Skolekampen", subtitle: "\(app.session.school) · velg regneart.", modes: GameMode.schoolModes) { mode in
                app.session.mode = mode
                app.session.level = .medium
                app.session.questionCount = mode.isTimeChallenge ? RegnemesterConstants.schoolBattleTimeQuestionCount : 10
                app.navigate(.start)
            }
        case .start:
            StartRoundView(app: app)
        case .play:
            PlayView(app: app)
        case .result:
            ResultView(app: app)
        case .highscoreHome:
            HighscoreHomeView(app: app)
        case .schoolHighscore:
            SchoolHighscoreView(app: app)
        case .normalHighscore:
            NormalHighscoreView(app: app)
        case .bossMode:
            ModeSelectionView(app: app, title: "Boss Battle", subtitle: "Velg regneart.", modes: GameMode.practiceModes) { mode in
                app.boss.mode = mode
                app.navigate(.bossSelect)
            }
        case .bossSelect:
            BossSelectView(app: app)
        case .bossPlay:
            BossPlayView(app: app)
        case .bossResult:
            BossResultView(app: app)
        case .adminLogin:
            AdminLoginView(app: app)
        case .adminHome:
            AdminHomeView(app: app)
        case .adminNormal:
            AdminNormalView(app: app)
        case .adminSchool:
            AdminSchoolView(app: app)
        case .qr:
            QRView(app: app)
        }
    }
}
