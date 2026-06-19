import Observation
import SwiftUI

struct AdminLoginView: View {
    @Bindable var app: AppModel
    @State private var pin = ""

    var body: some View {
        GameShell {
            HeroHeader(title: "Admin", subtitle: "Skriv adminkode for å fortsette.", systemImage: "shield.fill", color: Color(hex: "#e11d48"))
            Panel {
                SecureField("8-sifret kode", text: $pin)
                    .keyboardType(.numberPad)
                    .font(.system(size: 20, weight: .black, design: .rounded))
                    .multilineTextAlignment(.center)
                    .padding()
                    .background(Color(hex: "#f8fafc"))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                PrimaryButton(title: "Logg inn", systemImage: "lock.open.fill", color: Color(hex: "#e11d48"), disabled: pin.trimmingCharacters(in: .whitespacesAndNewlines).count < 4) {
                    Task {
                        if await app.validateAdmin(pin: pin) {
                            app.navigate(.adminHome)
                        }
                    }
                }
                if !app.adminMessage.isEmpty {
                    Text(app.adminMessage)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(hex: "#be123c"))
                }
            }
        }
    }
}

struct AdminHomeView: View {
    @Bindable var app: AppModel
    @State private var announcementEnabled = false
    @State private var announcementTitle = ""
    @State private var announcementMessage = ""

    var body: some View {
        GameShell {
            HeroHeader(title: "Admin", subtitle: "Velg hva du vil administrere.", systemImage: "shield.fill", color: Color(hex: "#e11d48"))

            Panel {
                Text("Skolekampen: \(app.schoolBattleEnabled ? "ÅPEN" : "STENGT")")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                PrimaryButton(title: app.schoolBattleEnabled ? "Steng Skolekampen" : "Åpne Skolekampen", systemImage: app.schoolBattleEnabled ? "lock.fill" : "lock.open.fill", color: app.schoolBattleEnabled ? Color(hex: "#e11d48") : Color(hex: "#059669")) {
                    Task { await app.toggleSchoolBattleFromAdmin() }
                }
            }

            Panel {
                Toggle("Aktiv startsidebeskjed", isOn: $announcementEnabled)
                    .font(.system(size: 17, weight: .black, design: .rounded))
                TextField("Tittel", text: $announcementTitle)
                    .textFieldStyle(.roundedBorder)
                TextField("Melding", text: $announcementMessage, axis: .vertical)
                    .lineLimit(3...5)
                    .textFieldStyle(.roundedBorder)
                PrimaryButton(title: "Publiser beskjed", systemImage: "megaphone.fill", color: Color(hex: "#2563eb"), disabled: announcementEnabled && announcementMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) {
                    Task {
                        await app.publishAnnouncement(title: announcementTitle, message: announcementMessage, enabled: announcementEnabled)
                    }
                }
                SecondaryButton(title: "Skru av beskjed", systemImage: "bell.slash.fill") {
                    Task {
                        await app.publishAnnouncement(title: announcementTitle, message: announcementMessage, enabled: false)
                        announcementEnabled = false
                    }
                }
            }

            Panel {
                PrimaryButton(title: "Normal highscore", systemImage: "list.number", color: Color(hex: "#2563eb")) {
                    app.navigate(.adminNormal)
                }
                PrimaryButton(title: "Skolekampen", systemImage: "building.2.fill", color: Color(hex: "#f97316")) {
                    app.navigate(.adminSchool)
                }
            }

            if !app.adminMessage.isEmpty {
                Text(app.adminMessage)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: "#9a3412"))
                    .padding()
                    .background(Color(hex: "#fff7ed"))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
        }
        .task {
            await app.refreshSchoolBattleStatus()
            await app.refreshAnnouncementSettings()
            announcementEnabled = app.announcementSettings.enabled
            announcementTitle = app.announcementSettings.title
            announcementMessage = app.announcementSettings.message
        }
    }
}

struct AdminNormalView: View {
    @Bindable var app: AppModel
    @State private var state: LoadState<[ScoreEntry]> = .idle
    @State private var search = ""

    var body: some View {
        GameShell {
            HeroHeader(title: "Normal admin", subtitle: "Samlet oversikt over Normal-lister.", systemImage: "shield.fill", color: Color(hex: "#e11d48"))
            Panel {
                TextField("Søk etter spillnavn", text: $search)
                    .textFieldStyle(.roundedBorder)
            }
            content
        }
        .task {
            await load()
        }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .idle, .loading:
            ProgressView("Laster resultater...")
        case .failed(let message):
            Text(message).foregroundStyle(Color(hex: "#be123c"))
        case .loaded(let scores):
            adminScoreList(scores.filter { search.isEmpty || $0.name.localizedCaseInsensitiveContains(search) })
        }
    }

    private func adminScoreList(_ scores: [ScoreEntry]) -> some View {
        Panel {
            if scores.isEmpty {
                Text("Ingen resultater funnet")
                    .font(.system(size: 18, weight: .black, design: .rounded))
            } else {
                ForEach(Array(scores.sorted { $0.score > $1.score }.enumerated()), id: \.element) { index, entry in
                    ScoreRow(rank: index + 1, entry: entry, timed: entry.mode.isTimeChallenge) {
                        Task { await delete(entry) }
                    }
                }
            }
        }
    }

    private func load() async {
        state = .loading
        do {
            state = .loaded(try await app.highscoreService.loadAllNormalAdminScores())
        } catch {
            state = .failed(error.localizedDescription)
        }
    }

    private func delete(_ entry: ScoreEntry) async {
        guard let id = entry.id else { return }
        do {
            try await app.adminService.deleteNormalScore(id: id, adminPin: app.adminAccessPin)
            await load()
            app.adminMessage = "Resultatet er slettet."
        } catch {
            app.adminMessage = error.localizedDescription
        }
    }
}

struct AdminSchoolView: View {
    @Bindable var app: AppModel
    @State private var selectedMode: GameMode = .addition
    @State private var gradeGroup: GradeGroup = .small
    @State private var state: LoadState<[ScoreEntry]> = .idle

    var body: some View {
        GameShell(theme: .school) {
            HeroHeader(title: "Skolekampen admin", subtitle: "Slett enkeltresultater.", systemImage: "shield.fill", color: Color(hex: "#e11d48"))
            HighscoreFilters(selectedMode: $selectedMode, gradeGroup: $gradeGroup, includeGradeGroup: selectedMode.isTimeChallenge, color: Color(hex: "#f97316"))
            content
        }
        .task(id: "\(selectedMode.rawValue)-\(gradeGroup.rawValue)") {
            await load()
        }
    }

    @ViewBuilder
    private var content: some View {
        switch state {
        case .idle, .loading:
            ProgressView("Laster resultater...")
        case .failed(let message):
            Text(message).foregroundStyle(Color(hex: "#be123c"))
        case .loaded(let scores):
            Panel {
                if scores.isEmpty {
                    Text("Ingen resultater")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                } else {
                    ForEach(Array(scores.enumerated()), id: \.element) { index, entry in
                        ScoreRow(rank: index + 1, entry: entry, timed: selectedMode.isTimeChallenge) {
                            Task { await delete(entry) }
                        }
                    }
                }
            }
        }
    }

    private func load() async {
        state = .loading
        do {
            state = .loaded(try await app.highscoreService.loadSchoolBattleScores(mode: selectedMode, gradeGroup: gradeGroup, limit: RegnemesterConstants.schoolBattleVisibleFetchLimit))
        } catch {
            state = .failed(error.localizedDescription)
        }
    }

    private func delete(_ entry: ScoreEntry) async {
        guard let id = entry.id else { return }
        do {
            try await app.adminService.deleteSchoolBattleScore(id: id, adminPin: app.adminAccessPin)
            await load()
            app.adminMessage = "Resultatet er slettet."
        } catch {
            app.adminMessage = error.localizedDescription
        }
    }
}
