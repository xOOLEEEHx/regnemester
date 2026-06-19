import Foundation
import Observation

@MainActor
@Observable
final class AppModel {
    var path: [Route] = []
    var presentedSheet: SheetDestination?
    var schoolBattleEnabled = true
    var schoolBattleStatusMessage = ""
    var announcementSettings: AnnouncementSettings = .empty
    var dismissedAnnouncementKey = ""
    var adminAccessPin = ""
    var adminMessage = ""

    @ObservationIgnored var localStore: LocalStore
    @ObservationIgnored var provider: SupabaseClientProvider
    @ObservationIgnored var highscoreService: HighscoreService
    @ObservationIgnored var adminService: AdminService
    let session: GameSessionStore
    let boss: BossBattleStore

    init() {
        let localStore = LocalStore()
        let provider = SupabaseClientProvider()
        let rest = provider.config.isConfigured ? SupabaseRESTClient(config: provider.config) : nil
        let highscoreService = HighscoreService(rest: rest, localStore: localStore)
        let adminService = AdminService(rest: rest, localStore: localStore, fallbackPin: provider.config.adminPinFallback)

        self.localStore = localStore
        self.provider = provider
        self.highscoreService = highscoreService
        self.adminService = adminService
        self.session = GameSessionStore(highscoreService: highscoreService, adminService: adminService)
        self.boss = BossBattleStore(localStore: localStore)
        self.dismissedAnnouncementKey = localStore.dismissedAnnouncementKey()
    }

    func navigate(_ route: Route) {
        path.append(route)
    }

    func replaceStack(with route: Route) {
        path = [route]
    }

    func popToRoot() {
        path.removeAll()
    }

    func pop() {
        if !path.isEmpty { path.removeLast() }
    }

    func refreshStartup() async {
        await refreshSchoolBattleStatus()
        await refreshAnnouncementSettings()
        await retryPendingScoresIfAllowed()
    }

    func refreshSchoolBattleStatus() async {
        do {
            schoolBattleEnabled = try await adminService.loadSchoolBattleEnabled(fallback: schoolBattleEnabled)
            if schoolBattleEnabled { schoolBattleStatusMessage = "" }
        } catch {
            print("[Regnemester] Kunne ikke hente Skolekampen-status: \(error.localizedDescription)")
        }
    }

    func refreshAnnouncementSettings() async {
        do {
            announcementSettings = try await adminService.loadAnnouncementSettings()
            maybePresentAnnouncement()
        } catch {
            print("[Regnemester] Kunne ikke hente startsidebeskjed: \(error.localizedDescription)")
        }
    }

    func maybePresentAnnouncement() {
        let key = announcementSettings.dismissKey
        guard announcementSettings.enabled,
              !announcementSettings.message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !key.isEmpty,
              dismissedAnnouncementKey != key else { return }
        presentedSheet = .announcement
    }

    func dismissAnnouncement() {
        let key = announcementSettings.dismissKey
        localStore.dismissAnnouncement(key)
        dismissedAnnouncementKey = key
        presentedSheet = nil
    }

    func openSchoolBattle() async {
        await refreshSchoolBattleStatus()
        guard schoolBattleEnabled else {
            schoolBattleStatusMessage = "Skolekampen er for øyeblikket stengt.\nDu kan fortsatt spille de andre modusene."
            return
        }
        schoolBattleStatusMessage = ""
        session.configureSchoolBattle()
        navigate(.school)
    }

    func validateAdmin(pin: String) async -> Bool {
        let cleanPin = pin.trimmingCharacters(in: .whitespacesAndNewlines)
        do {
            let valid = try await adminService.validateAdminPin(cleanPin)
            if valid {
                adminAccessPin = cleanPin
                adminMessage = ""
            } else {
                adminMessage = "Feil adminkode."
            }
            return valid
        } catch {
            adminMessage = error.localizedDescription
            return false
        }
    }

    func toggleSchoolBattleFromAdmin() async {
        let next = !schoolBattleEnabled
        do {
            try await adminService.setSchoolBattleEnabled(next, adminPin: adminAccessPin)
            schoolBattleEnabled = next
            adminMessage = next ? "Skolekampen er nå åpen." : "Skolekampen er nå stengt."
        } catch {
            adminMessage = error.localizedDescription
        }
    }

    func publishAnnouncement(title: String, message: String, enabled: Bool) async {
        let settings = AnnouncementSettings(enabled: enabled, title: title.trimmingCharacters(in: .whitespacesAndNewlines), message: message.trimmingCharacters(in: .whitespacesAndNewlines), version: ISO8601DateFormatter().string(from: Date()))
        do {
            try await adminService.setAnnouncement(settings, adminPin: adminAccessPin)
            announcementSettings = settings
            adminMessage = enabled ? "Startsidebeskjed er publisert." : "Startsidebeskjed er skrudd av."
        } catch {
            adminMessage = error.localizedDescription
        }
    }

    func retryPendingScoresIfAllowed() async {
        let result = await highscoreService.retryPendingHighscores(includeSchoolBattle: schoolBattleEnabled)
        if result.saved > 0 {
            session.scoreMessage = "Tidligere resultat ble lagret på highscore."
        }
    }
}
