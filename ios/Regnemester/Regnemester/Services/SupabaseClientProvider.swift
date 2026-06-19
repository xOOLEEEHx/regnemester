import Foundation
import Supabase

struct SupabaseRuntimeConfig: Equatable {
    var url: String
    var key: String
    var adminPinFallback: String

    var isConfigured: Bool {
        url.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false &&
            key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false &&
            url.contains("supabase.co")
    }

    static func fromBundle(_ bundle: Bundle = .main) -> SupabaseRuntimeConfig {
        let url = bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        let key = bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? ""
        let fallback = bundle.object(forInfoDictionaryKey: "ADMIN_PIN_FALLBACK") as? String ?? "48291736"
        return SupabaseRuntimeConfig(url: url, key: key, adminPinFallback: fallback)
    }
}

struct SupabaseClientProvider {
    let config: SupabaseRuntimeConfig
    let client: SupabaseClient?

    init(config: SupabaseRuntimeConfig = .fromBundle()) {
        self.config = config
        if config.isConfigured, let url = URL(string: config.url) {
            client = SupabaseClient(supabaseURL: url, supabaseKey: config.key)
        } else {
            client = nil
        }
    }
}

enum SupabaseRequestError: LocalizedError {
    case notConfigured
    case invalidURL
    case server(status: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .notConfigured: "Supabase er ikke konfigurert."
        case .invalidURL: "Supabase-URL er ugyldig."
        case .server(let status, let message): "Supabase svarte \(status): \(message)"
        }
    }
}

struct SupabaseRESTClient {
    let config: SupabaseRuntimeConfig
    let session: URLSession

    init(config: SupabaseRuntimeConfig, session: URLSession = .shared) {
        self.config = config
        self.session = session
    }

    var isConfigured: Bool { config.isConfigured }

    func fetchScores(queryItems: [URLQueryItem]) async throws -> [ScoreEntry] {
        let data = try await request(path: "rest/v1/scores", queryItems: queryItems)
        return try JSONDecoder().decode([ScoreEntry].self, from: data)
    }

    func insertScore(_ entry: ScoreEntry) async throws {
        let data = try JSONEncoder().encode(entry)
        _ = try await request(path: "rest/v1/scores", method: "POST", body: data, prefer: "return=minimal")
    }

    func deleteScores(ids: [String]) async throws {
        guard !ids.isEmpty else { return }
        let joined = ids.joined(separator: ",")
        _ = try await request(
            path: "rest/v1/scores",
            method: "DELETE",
            queryItems: [URLQueryItem(name: "id", value: "in.(\(joined))")],
            prefer: "return=minimal"
        )
    }

    func fetchSettings(keys: [String]) async throws -> [AppSettingRow] {
        let keyList = keys.joined(separator: ",")
        let data = try await request(
            path: "rest/v1/app_settings",
            queryItems: [
                URLQueryItem(name: "select", value: "key,value"),
                URLQueryItem(name: "key", value: "in.(\(keyList))")
            ]
        )
        return try JSONDecoder().decode([AppSettingRow].self, from: data)
    }

    func callRPC<Body: Encodable>(_ name: String, body: Body) async throws -> Data {
        let data = try JSONEncoder().encode(body)
        return try await request(path: "rest/v1/rpc/\(name)", method: "POST", body: data)
    }

    private func request(
        path: String,
        method: String = "GET",
        queryItems: [URLQueryItem] = [],
        body: Data? = nil,
        prefer: String? = nil
    ) async throws -> Data {
        guard config.isConfigured else { throw SupabaseRequestError.notConfigured }
        guard let baseURL = URL(string: config.url) else { throw SupabaseRequestError.invalidURL }
        let endpoint = path
            .split(separator: "/")
            .reduce(baseURL) { partial, component in
                partial.appendingPathComponent(String(component))
            }
        guard var components = URLComponents(url: endpoint, resolvingAgainstBaseURL: false) else {
            throw SupabaseRequestError.invalidURL
        }
        if !queryItems.isEmpty { components.queryItems = queryItems }
        guard let url = components.url else { throw SupabaseRequestError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.setValue(config.key, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(config.key)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let prefer { request.setValue(prefer, forHTTPHeaderField: "Prefer") }

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else { return data }
        guard (200..<300).contains(httpResponse.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Ukjent feil"
            throw SupabaseRequestError.server(status: httpResponse.statusCode, message: message)
        }
        return data
    }
}

struct AppSettingRow: Codable, Hashable {
    var key: String
    var value: JSONSettingValue?
}

enum JSONSettingValue: Codable, Hashable {
    case string(String)
    case bool(Bool)
    case number(Double)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let bool = try? container.decode(Bool.self) {
            self = .bool(bool)
        } else if let number = try? container.decode(Double.self) {
            self = .number(number)
        } else {
            self = .string((try? container.decode(String.self)) ?? "")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }

    var stringValue: String {
        switch self {
        case .string(let value): value
        case .bool(let value): value ? "true" : "false"
        case .number(let value): String(value)
        case .null: ""
        }
    }

    func boolValue(fallback: Bool) -> Bool {
        switch self {
        case .bool(let value): return value
        case .number(let value): return value != 0
        case .string(let value):
            let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            if normalized == "true" { return true }
            if normalized == "false" { return false }
            return fallback
        case .null:
            return fallback
        }
    }
}
