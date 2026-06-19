import Foundation

final class AdminService {
    private let rest: SupabaseRESTClient?
    private let localStore: LocalStore
    private let fallbackPin: String

    init(rest: SupabaseRESTClient?, localStore: LocalStore, fallbackPin: String) {
        self.rest = rest?.isConfigured == true ? rest : nil
        self.localStore = localStore
        self.fallbackPin = fallbackPin
    }

    func loadSchoolBattleEnabled(fallback: Bool = true) async throws -> Bool {
        guard let rest else { return fallback }
        let rows = try await rest.fetchSettings(keys: [AppSettingKey.schoolBattleEnabled])
        return rows.first?.value?.boolValue(fallback: fallback) ?? fallback
    }

    func loadAnnouncementSettings() async throws -> AnnouncementSettings {
        guard let rest else { return localStore.loadLocalAnnouncementSettings() }
        let rows = try await rest.fetchSettings(keys: AppSettingKey.announcementKeys)
        var values: [String: JSONSettingValue] = [:]
        rows.forEach { row in
            if let value = row.value { values[row.key] = value }
        }
        return AnnouncementSettings(
            enabled: values[AppSettingKey.announcementEnabled]?.boolValue(fallback: false) ?? false,
            title: values[AppSettingKey.announcementTitle]?.stringValue ?? "",
            message: values[AppSettingKey.announcementMessage]?.stringValue ?? "",
            version: values[AppSettingKey.announcementVersion]?.stringValue ?? ""
        )
    }

    func validateAdminPin(_ pin: String) async throws -> Bool {
        guard let rest else { return pin == fallbackPin }
        let data = try await rest.callRPC("validate_admin_pin", body: AdminPinRPC(admin_pin: pin))
        if let bool = try? JSONDecoder().decode(Bool.self, from: data) { return bool }
        if let array = try? JSONDecoder().decode([Bool].self, from: data), let first = array.first { return first }
        return false
    }

    func setSchoolBattleEnabled(_ enabled: Bool, adminPin: String) async throws {
        guard let rest else { return }
        _ = try await rest.callRPC("set_school_battle_enabled", body: SetSchoolBattleRPC(p_enabled: enabled, p_admin_pin: adminPin))
    }

    func setAnnouncement(_ settings: AnnouncementSettings, adminPin: String) async throws {
        guard let rest else {
            localStore.saveLocalAnnouncementSettings(settings)
            return
        }
        _ = try await rest.callRPC(
            "set_announcement_settings",
            body: SetAnnouncementRPC(p_enabled: settings.enabled, p_title: settings.title, p_message: settings.message, p_admin_pin: adminPin)
        )
    }

    func deleteNormalScore(id: String, adminPin: String) async throws {
        guard let rest else {
            localStore.saveScores(localStore.loadScores().filter { $0.id != id })
            return
        }
        _ = try await rest.callRPC("delete_normal_score", body: DeleteNormalRPC(admin_pin: adminPin, score_id: id))
    }

    func deleteSchoolBattleScore(id: String, adminPin: String) async throws {
        guard let rest else {
            localStore.saveScores(localStore.loadScores().filter { $0.id != id })
            return
        }
        _ = try await rest.callRPC("delete_school_battle_score", body: DeleteSchoolRPC(delete_pin: adminPin, score_id: id))
    }

    func resetNormalScoreList(adminPin: String, mode: GameMode, level: GameLevel, gradeLevel: Int, questionCount: Int?) async throws {
        guard let rest else {
            guard adminPin == fallbackPin else { throw AdminError.invalidPin }
            let remaining = localStore.loadScores().filter { entry in
                let sameBase = entry.gameType == .normal && entry.mode == mode && entry.level == level && entry.gradeLevel == gradeLevel
                if !sameBase { return true }
                if !mode.isTimeChallenge { return false }
                return entry.questionCount != questionCount
            }
            localStore.saveScores(remaining)
            return
        }
        _ = try await rest.callRPC(
            "reset_normal_score_list",
            body: ResetNormalRPC(admin_pin: adminPin, reset_mode: mode.rawValue, reset_level: level.rawValue, reset_grade_level: gradeLevel, reset_question_count: mode.isTimeChallenge ? questionCount : nil)
        )
    }
}

enum AdminError: LocalizedError {
    case invalidPin

    var errorDescription: String? {
        switch self {
        case .invalidPin: "Feil adminkode."
        }
    }
}

private struct AdminPinRPC: Encodable {
    var admin_pin: String
}

private struct SetSchoolBattleRPC: Encodable {
    var p_enabled: Bool
    var p_admin_pin: String
}

private struct SetAnnouncementRPC: Encodable {
    var p_enabled: Bool
    var p_title: String
    var p_message: String
    var p_admin_pin: String
}

private struct DeleteNormalRPC: Encodable {
    var admin_pin: String
    var score_id: String
}

private struct DeleteSchoolRPC: Encodable {
    var delete_pin: String
    var score_id: String
}

private struct ResetNormalRPC: Encodable {
    var admin_pin: String
    var reset_mode: String
    var reset_level: String
    var reset_grade_level: Int
    var reset_question_count: Int?
}
