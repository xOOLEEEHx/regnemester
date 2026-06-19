import SwiftUI
import UIKit

enum ShellTheme {
    case normal
    case school
    case boss
    case plain

    var background: LinearGradient {
        switch self {
        case .normal:
            LinearGradient(colors: [Color(hex: "#eff6ff"), Color(hex: "#dbeafe"), Color(hex: "#e0f2fe")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .school:
            LinearGradient(colors: [Color(hex: "#fff7ed"), Color(hex: "#ffedd5"), Color(hex: "#fef3c7")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .boss:
            LinearGradient(colors: [Color(hex: "#fdf2f8"), Color(hex: "#f5d0fe"), Color(hex: "#ede9fe")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .plain:
            LinearGradient(colors: [Color(hex: "#f8fafc"), Color(hex: "#e0f2fe")], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    var primary: Color {
        switch self {
        case .normal, .plain: Color(hex: "#2563eb")
        case .school: Color(hex: "#f97316")
        case .boss: Color(hex: "#be185d")
        }
    }
}

struct GameShell<Content: View>: View {
    var theme: ShellTheme = .plain
    var content: () -> Content

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 18) {
                    content()
                }
                .frame(maxWidth: 720)
                .padding(.horizontal, 18)
                .padding(.vertical, 24)
                .frame(maxWidth: .infinity)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct HeroHeader: View {
    var title: String
    var subtitle: String = ""
    var systemImage: String = "sparkles"
    var color: Color = Color(hex: "#2563eb")

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 34, weight: .black))
                .foregroundStyle(.white)
                .frame(width: 72, height: 72)
                .background(color.gradient)
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                .shadow(color: color.opacity(0.25), radius: 18, y: 10)
            Text(title)
                .font(.system(size: 44, weight: .black, design: .rounded))
                .multilineTextAlignment(.center)
                .foregroundStyle(Color(hex: "#0f172a"))
            if !subtitle.isEmpty {
                Text(subtitle)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Color(hex: "#64748b"))
            }
        }
        .padding(.top, 8)
    }
}

struct Panel<Content: View>: View {
    var content: () -> Content

    var body: some View {
        VStack(spacing: 14) {
            content()
        }
        .padding(18)
        .frame(maxWidth: .infinity)
        .background(.white.opacity(0.96))
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color(hex: "#e2e8f0"), lineWidth: 1)
        }
        .shadow(color: .black.opacity(0.08), radius: 18, y: 10)
    }
}

struct PrimaryButton: View {
    var title: String
    var systemImage: String?
    var role: ButtonRole?
    var color: Color = Color(hex: "#2563eb")
    var disabled = false
    var action: () -> Void

    var body: some View {
        Button(role: role, action: action) {
            HStack {
                if let systemImage { Image(systemName: systemImage) }
                Text(title)
                    .lineLimit(2)
                    .minimumScaleFactor(0.75)
            }
            .font(.system(size: 17, weight: .black, design: .rounded))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .minHeight(52)
            .padding(.horizontal, 14)
            .background(disabled ? Color.gray.opacity(0.45) : color.gradient)
            .clipShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
            .shadow(color: color.opacity(disabled ? 0 : 0.2), radius: 12, y: 6)
        }
        .disabled(disabled)
    }
}

struct SecondaryButton: View {
    var title: String
    var systemImage: String?
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                if let systemImage { Image(systemName: systemImage) }
                Text(title)
                    .lineLimit(2)
                    .minimumScaleFactor(0.75)
            }
            .font(.system(size: 16, weight: .black, design: .rounded))
            .foregroundStyle(Color(hex: "#0f172a"))
            .frame(maxWidth: .infinity)
            .minHeight(50)
            .padding(.horizontal, 14)
            .background(.white.opacity(0.92))
            .clipShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 17, style: .continuous)
                    .stroke(Color(hex: "#e2e8f0"), lineWidth: 1)
            }
        }
    }
}

struct ModeCard: View {
    var title: String
    var subtitle: String
    var imagePath: String
    var color: Color
    var disabled = false
    var badge: String?
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack(alignment: .bottom) {
                BundleImage(path: imagePath, contentMode: .fill)
                    .frame(height: 174)
                    .clipped()
                    .overlay {
                        LinearGradient(colors: [.clear, .black.opacity(0.58)], startPoint: .center, endPoint: .bottom)
                    }
                VStack(spacing: 5) {
                    if let badge {
                        Text(badge)
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .padding(.horizontal, 9)
                            .padding(.vertical, 5)
                            .background(.black.opacity(0.45))
                            .clipShape(Capsule())
                    }
                    Text(title)
                        .font(.system(size: 25, weight: .black, design: .rounded))
                    Text(subtitle)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .multilineTextAlignment(.center)
                }
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.7), radius: 6, y: 2)
                .padding(16)
            }
            .frame(maxWidth: .infinity)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(alignment: .topTrailing) {
                if disabled {
                    Text("Stengt")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(.black.opacity(0.62))
                        .clipShape(Capsule())
                        .padding(10)
                }
            }
            .opacity(disabled ? 0.68 : 1)
        }
        .disabled(disabled)
        .buttonStyle(.plain)
    }
}

struct QuestionCard: View {
    var question: Question
    var label: String
    var theme: ShellTheme

    var body: some View {
        Panel {
            Text(label.uppercased())
                .font(.system(size: 12, weight: .black, design: .rounded))
                .tracking(2)
                .foregroundStyle(theme.primary)
            Text("\(question.a) \(question.symbol) \(question.b) = ?")
                .font(.system(size: 48, weight: .black, design: .rounded))
                .minimumScaleFactor(0.55)
                .lineLimit(1)
                .foregroundStyle(Color(hex: "#0f172a"))
        }
    }
}

struct AnswerGrid: View {
    var options: [Int]
    var correct: Int
    var feedback: AnswerFeedback?
    var theme: ShellTheme
    var answer: (Int) -> Void

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
            ForEach(options, id: \.self) { option in
                Button {
                    answer(option)
                } label: {
                    Text("\(option)")
                        .font(.system(size: 38, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 96)
                        .background(color(for: option).gradient)
                        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                        .shadow(color: color(for: option).opacity(0.22), radius: 12, y: 6)
                }
                .disabled(feedback != nil)
            }
        }
    }

    private func color(for option: Int) -> Color {
        guard let feedback else { return theme.primary }
        if option == correct { return Color(hex: "#059669") }
        return feedback == .wrong ? Color(hex: "#e11d48") : theme.primary
    }
}

struct ScoreRow: View {
    var rank: Int
    var entry: ScoreEntry
    var timed: Bool
    var trailingAction: (() -> Void)?

    var body: some View {
        HStack(spacing: 12) {
            Text("\(rank)")
                .font(.system(size: 17, weight: .black, design: .rounded))
                .foregroundStyle(rank == 1 ? .white : Color(hex: "#1d4ed8"))
                .frame(width: 38, height: 38)
                .background(rank == 1 ? Color(hex: "#facc15") : Color(hex: "#dbeafe"))
                .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.name)
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .lineLimit(1)
                if let school = entry.school, !school.isEmpty {
                    Text("\(school) · \(schoolBattleClassLabel(entry.gradeLevel))")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(hex: "#64748b"))
                        .lineLimit(1)
                }
            }
            Spacer()
            Text(timed ? formattedTime(entry.score) : "\(entry.score)")
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundStyle(Color(hex: "#059669"))
            if let trailingAction {
                Button("Slett", role: .destructive, action: trailingAction)
                    .font(.system(size: 13, weight: .black, design: .rounded))
            }
        }
        .padding(12)
        .background(Color(hex: "#f8fafc"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct BundleImage: View {
    var path: String
    var contentMode: ContentMode = .fit

    var body: some View {
        Group {
            if let image = loadImage() {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            } else {
                RoundedRectangle(cornerRadius: 18)
                    .fill(Color(hex: "#dbeafe"))
                    .overlay(Image(systemName: "photo").font(.largeTitle).foregroundStyle(Color(hex: "#2563eb")))
            }
        }
        .accessibilityHidden(true)
    }

    private func loadImage() -> UIImage? {
        let nsPath = path as NSString
        let directory = nsPath.deletingLastPathComponent
        let name = nsPath.lastPathComponent
        let bundleDirectory = directory.isEmpty ? "Public" : "Public/\(directory)"
        guard let file = Bundle.main.path(forResource: name, ofType: nil, inDirectory: bundleDirectory) else { return nil }
        return UIImage(contentsOfFile: file)
    }
}

struct AnnouncementSheet: View {
    @Bindable var app: AppModel

    var body: some View {
        VStack(spacing: 18) {
            Text(app.announcementSettings.title.isEmpty ? "Nyhet i Regnemester!" : app.announcementSettings.title)
                .font(.system(size: 30, weight: .black, design: .rounded))
                .multilineTextAlignment(.center)
            Text(app.announcementSettings.message)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center)
                .foregroundStyle(Color(hex: "#334155"))
            PrimaryButton(title: "OK", systemImage: "checkmark", action: app.dismissAnnouncement)
        }
        .padding(24)
        .presentationDetents([.medium])
    }
}

extension View {
    func minHeight(_ height: CGFloat) -> some View {
        frame(minHeight: height)
    }
}

extension Color {
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&int)
        let r, g, b: UInt64
        switch cleaned.count {
        case 3:
            (r, g, b) = ((int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        default:
            (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: 1)
    }
}
