# Regnemester iOS

Native SwiftUI-port av webappen i repo-roten.

## Setup

1. Kopier `Config/SupabaseConfig.xcconfig.example` til `Config/SupabaseConfig.xcconfig`.
2. Legg inn public Supabase URL og publishable/anon key. Ikke bruk `service_role` eller secret key.
3. Åpne `Regnemester.xcodeproj` i Xcode.
4. La Swift Package Manager hente `https://github.com/supabase/supabase-swift.git`.
5. Velg scheme `Regnemester` og kjør på iOS 17+ simulator.

Bildene i `Regnemester/Resources/Public` er kopiert fra webappens `public/`-mappe. Webappen ligger urørt og kan fortsatt bygges separat med `npm.cmd run build`.
