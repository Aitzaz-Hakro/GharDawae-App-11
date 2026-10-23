# Eldora Care App --- UI Replication & Motion Specification

## React Native + Expo implementation guide

**Reference:** the supplied Eldora Care concept image.\
**Goal:** reproduce the visual language and the four app screens shown
in the reference as a polished, responsive React Native application
using Expo.

------------------------------------------------------------------------

## 1. How to read the reference

The image is a **design presentation board**, not one literal phone
screenshot. It contains four tall mobile-screen mockups arranged side by
side, plus a row of five product-value cards along the bottom:

1.  **Welcome / onboarding** --- brand introduction and primary "Get
    Started" action.
2.  **Home dashboard** --- greeting, daily wellness check-in, feature
    shortcuts, and upcoming appointment.
3.  **Health dashboard** --- wellness score, vitals, health insights,
    medication reminder, and a daily tip.
4.  **Connect dashboard** --- family contacts, upcoming video call,
    community groups, and messages.
5.  **Value propositions** --- Privacy First, AI Companion, Future
    Ready, Health Trends, and Easy to Use. These are likely
    marketing/onboarding content rather than a persistent in-app footer.

Implement these as separate navigable screens. Do not try to fit all
four tall mockups into one phone screen. The image's bottom value cards
are best used on the onboarding/intro experience or in an optional "Why
Eldora" section.

## 2. Visual direction and design language

### Overall feel

-   Warm, reassuring, human, accessible, and calm.
-   Senior-friendly care companion rather than a clinical hospital
    interface.
-   Rounded cards, soft edges, muted colors, spacious composition,
    friendly illustrations/avatars, and low visual noise.
-   Prefer readable labels and generous tap targets over exact tiny text
    from the presentation image.

### Suggested design tokens

Treat these as **starting estimates from the image**, not measured
source design tokens. Adjust against the reference during
implementation.

  -----------------------------------------------------------------------
  Token                   Suggested value         Use
  ----------------------- ----------------------- -----------------------
  App background          `#F7F0E9`               Warm ivory canvas

  Card surface            `#FFFAF6`               Main cards and screen
                                                  panels

  Soft peach              `#FBE1D1`               Wellness, call, and
                                                  highlighted cards

  Peach accent            `#F4B69F`               Illustration accents,
                                                  selected highlights

  Deep forest green       `#285B49`               Primary CTA, active
                                                  navigation, wellness
                                                  emphasis

  Pale green              `#E4EBDD`               Connect and health
                                                  shortcut cards

  Warm tan                `#E9D7C7`               Decorative surfaces and
                                                  secondary backgrounds

  Primary text            `#18221E`               Headlines and key
                                                  labels

  Secondary text          `#66645E`               Supporting text and
                                                  timestamps

  Border                  `#E9D8CA`               Subtle card outlines

  White                   `#FFFFFF`               Avatar rings, icon
                                                  strokes, contrast
  -----------------------------------------------------------------------

**Typography** - Use a friendly, legible sans-serif for most UI. The
welcome brand word "Eldora" can use a restrained serif to echo the
editorial feel in the reference. - Suggested family: system font
initially; optionally use `@expo-google-fonts/dm-sans` or
`@expo-google-fonts/manrope` for UI, and a serif such as
`@expo-google-fonts/lora` for the brand title. - Hierarchy: brand title
28--32 px; screen title 18--22 px; card heading 13--15 px; body 12--14
px; metadata 10--12 px. Avoid making essential text as small as it
appears in the composite image. - Use medium/semibold weights for
headings; avoid excessive boldness. - Keep line height around 1.25--1.45
times font size.

**Shape and spacing** - Main screen panel in the reference has large
rounded corners, approximately 18--24 px. - Cards: 12--18 px radius;
pill buttons: 999 px radius. - Use an 8-point spacing system: 4, 8, 12,
16, 20, 24, 32. - Hairline borders and very soft shadows only. Avoid
dark, floating shadows. - Use consistent 16--20 px horizontal page
padding on a normal phone, increasing to 24 px on wider devices. - Icons
are thin, friendly line icons with occasional pastel icon backgrounds.

### Screen shell

-   Use a warm ivory background across the app.
-   Respect safe areas at the top and bottom.
-   Each screen should scroll vertically where content may exceed the
    viewport.
-   The four screen mockups have a visible rounded device/panel outline
    in the concept board. In the actual app, use the device screen as
    the canvas; do **not** render an extra phone frame around the whole
    screen.
-   Use a shared bottom tab bar on Home, Health, Connect, Services, and
    Profile. The welcome screen is outside the main tab shell.
-   Keep the main tab bar stable while the content above it scrolls.

------------------------------------------------------------------------

## 3. Screen 1 --- Welcome / onboarding

### Purpose

Establish trust, explain the product in a few seconds, and give a clear
first action. This screen should feel warm and personal rather than
technical.

### Layout, top to bottom

1.  **Canvas and hero panel**
    -   Warm ivory background.
    -   A tall off-white content surface with a thin warm border and
        large radius, inset slightly from the phone edges.
    -   Use a two-column hero region where possible: copy on the left
        and a senior-person portrait/illustration on the right. On
        narrow devices, keep the image aligned to the upper/right side
        and let the copy occupy a readable width.
2.  **Brand mark**
    -   Small heart/leaf-style icon in a circular or simple outline
        treatment.
    -   "Eldora" brand name in a dark green serif or elegant display
        face.
3.  **Headline**
    -   Three short lines, approximately: "Care that connects. Support
        that empowers."
    -   Strong contrast, comfortable line height, and a clear reading
        order.
4.  **Supporting copy**
    -   Short sentence explaining the app as a care companion for
        seniors and loved ones.
    -   Keep this concise; the purpose is emotional clarity, not a full
        feature list.
5.  **Hero visual**
    -   A warm, respectful portrait/illustration of an older adult,
        cropped from the right side of the hero region.
    -   Use a supplied licensed asset or create a consistent
        illustration set. Do not rely on random remote image URLs at
        runtime.
    -   Avoid placing text over the face.
6.  **Three mini-benefit cards**
    -   **Support** --- emotional and practical help.
    -   **Connect** --- family and community.
    -   **Empower** --- independence and wellbeing.
    -   Each uses a pastel icon tile, short label, and one or two lines
        of helper text.
    -   Equal widths in a row when the device is wide enough; on very
        narrow devices, allow horizontal scrolling or a two-row layout.
7.  **Primary CTA**
    -   Full-width deep-green pill button: "Get Started".
    -   Target height: 50--56 px.
    -   Strong white label and visible pressed state.
8.  **Existing-user action**
    -   Small "Already have an account? Sign in" row below the CTA.
    -   Make "Sign in" a distinct accessible link with a proper hit
        target.

### Behavior

-   "Get Started" opens the first setup/onboarding step or account
    creation.
-   "Sign in" navigates to authentication.
-   If onboarding is completed, remember that state securely using the
    app's normal persistence strategy and route returning users to the
    appropriate destination.
-   Avoid requesting health permissions on the welcome screen. Explain
    permissions contextually when the feature is first used.

### Motion

-   On first entry, fade the canvas in and move the hero content upward
    by about 12--16 px over 350--500 ms.
-   Stagger the benefit cards by roughly 60--90 ms each.
-   The portrait can use a subtle opacity/scale entrance (e.g. 0.97 to
    1.0); avoid a dramatic zoom.
-   CTA press: scale to approximately 0.98 and restore on release, with
    a subtle haptic only for a deliberate primary action.
-   Respect reduced-motion settings; remove stagger and large movement
    when reduced motion is enabled.

------------------------------------------------------------------------

## 4. Screen 2 --- Home dashboard

### Purpose

Provide a friendly daily landing page and make the most common actions
immediately visible.

### Top app bar

-   Left: compact menu or navigation icon.
-   Right: notification bell with an optional unread dot/badge.
-   Use a single horizontal row, vertically centered, with 44--48 px
    interactive targets.
-   The reference has no large title in the top bar; the greeting
    becomes the visual heading.

### Greeting / hero row

-   Main copy: "Good morning, Anita" with a small warm
    emoji/illustration accent.
-   Supporting question: "How are you feeling today?"
-   Right side: friendly senior/caregiver illustration or avatar
    cluster.
-   Align the text and image without making the text column too narrow.
-   If the greeting depends on time of day, use the device's local time
    and keep the greeting stable while the screen remains open.

### Daily Wellness card

-   Highlighted peach card with:
    -   Title: "Daily Wellness"
    -   Short prompt, e.g. "Let's take care of you today"
    -   Small "Check in" button
    -   Circular smiley/wellbeing illustration at the right
-   The CTA should remain easy to tap and should not rely on color alone
    to communicate status.
-   On check-in, open a short mood/wellness flow. Do not infer a medical
    diagnosis from the mood selection.

### "What would you like to do?" shortcuts

Use a responsive two-row grid of six compact cards: 1. **Health** ---
track a monitor/health summary. 2. **Medication** --- reminders and
schedule. 3. **Connect** --- family and friends. 4. **Activities** ---
stay engaged. 5. **Care Services** --- professional help. 6.
**Resources** --- guides and support.

Each shortcut card: - Pastel background with a thin border. - Centered
icon inside a soft icon tile. - Short title and a compact descriptor. -
Consistent height and alignment, with no truncation of important
labels. - Entire card is tappable, not just the icon. - Use a two-column
grid on smaller phones if six columns/three columns would make labels
too small. The reference mockup uses a compact three-column grid, but
usability takes priority on narrow devices.

### Upcoming appointment

-   Section header "Upcoming" with "View all" action on the right.
-   A single peach-tinted appointment card with calendar icon,
    appointment title, date/time, and location/context.
-   Example content in the reference: doctor appointment, May 25, 2024
    at 10:00 AM, City Health Clinic. Treat this as sample content only;
    use real app data in production.
-   Include loading, empty, and error states:
    -   Loading: restrained skeleton placeholders.
    -   Empty: friendly message and a way to add/view appointments.
    -   Error: retry action without blocking other dashboard features.

### Bottom tab bar

Five destinations shown in the reference: - Home - Health - Connect -
Services - Profile

Design: - Fixed at the bottom, with icon above a short label. - Selected
destination uses deep green and a clear selected state; inactive items
use muted gray. - Use an appropriate safe-area inset. - Keep labels
readable. Do not shrink them excessively to fit. - Use actual navigation
state to determine the selected tab, not a hard-coded color.

### Home interactions

-   Notification icon opens notifications.
-   "Check in" starts the wellbeing flow.
-   Shortcut cards navigate to their corresponding screens.
-   "View all" opens the appointments list.
-   Appointment card opens appointment details.

### Motion

-   Greeting and illustration: gentle fade/slide entrance on initial
    screen mount.
-   Wellness card: short opacity + translateY entrance after the
    greeting.
-   Shortcut cards: small staggered entrance; avoid re-running the
    animation on every tiny state update.
-   Tapping a shortcut: quick scale feedback (0.98) and light haptic if
    appropriate.
-   Check-in completion: animate the smiley/status change with a small
    scale or crossfade.
-   Pull-to-refresh may refresh dashboard data; keep the indicator
    native and restrained.
-   Tab transitions: short crossfade or subtle horizontal transition,
    around 180--250 ms. Avoid stacking multiple competing transitions.

------------------------------------------------------------------------

## 5. Screen 3 --- Health dashboard

### Purpose

Present wellness information in a reassuring, scannable way. It must not
imply that a wellness score is a diagnosis.

### Header

-   Back/leading navigation icon at the left.
-   Centered title "Health".
-   Calendar/history action on the right.
-   Maintain a predictable header height and aligned touch targets.

### Health Overview card

A prominent peach/off-white card containing: - "Health Overview"
heading. - Short explanatory line such as "You're doing great". - A
large circular score visualization with a sample score of **85**. - A
clear label such as "Wellness Score" and status "Good". - A compact
vitals column on the right: - Steps (example: 4,230 / 6,000) - Heart
rate (example: 72 bpm) - Sleep (example: 6 h 45 m) - Water (example: 5 /
8 cups)

Implementation notes: - Values are illustrative. Replace them with
connected or user-entered data. - Use small icons and short labels, but
preserve readable contrast. - A circular score can be implemented with
SVG arcs or a progress component. Keep the score's meaning transparent
and explain how it is calculated in product copy. - Do not treat the
illustrative values as live sensor data. - Use "Not available" or a
clear empty state when data is missing; do not invent health readings.

### Health Insights

-   Section heading "Health Insights" with "View all".
-   A horizontal or full-width insight card containing a positive,
    non-alarmist observation, e.g. "Great job staying active!" and a
    trend summary.
-   Illustration on the right: walking shoes, activity icon, or
    similarly calm visual.
-   Example insight in the reference: walked 20% more than yesterday.
    Only show this when supported by actual data.

### Medication Reminder

-   Section title and "View all".
-   Single reminder row/card with:
    -   Bell or medication icon.
    -   Medication name (example: Vitamin D).
    -   Dose/schedule text (example: 1 tablet · After breakfast).
    -   Time aligned to the right (example: 9:00 AM).
-   Make reminder status and next action clear.
-   Support taken, snoozed, skipped, and overdue states if those are
    part of the product requirements. Confirmation should be explicit;
    do not mark a dose as taken just because the reminder was opened.
-   Use local notifications only after the user has granted permission
    and configured reminders.

### Today's Tip

-   Small off-white card with:
    -   Heading "Today's Tip".
    -   One or two sentences of general wellness advice.
    -   Small plant/nature illustration.
-   Keep tips informational and non-diagnostic. Where medical advice is
    needed, direct users to a qualified professional rather than
    presenting generated advice as authoritative.

### Health screen states

-   Loading: skeletons sized like the final cards to reduce layout
    shift.
-   No connected data: explain how to add or connect data and show
    manual-entry options if supported.
-   Permission denied: provide a short explanation and a Settings route
    where available.
-   Data stale: show a "Last updated" timestamp where appropriate.
-   Error: offer retry and preserve the rest of the screen.

### Motion

-   Score ring animates from 0 to its value over roughly 600--900 ms on
    first load; avoid restarting on every render.
-   Vitals appear with a light stagger or fade, not a dramatic count-up
    that could imply precision beyond the data.
-   Insight card enters with a subtle opacity/translateY transition.
-   Medication state changes use a brief color/opacity transition and a
    clear confirmation state.
-   Use reduced-motion behavior and avoid flashing, pulsing, or urgent
    red animation for routine reminders.

------------------------------------------------------------------------

## 6. Screen 4 --- Connect dashboard

### Purpose

Help the user maintain relationships, join communities, and see
communication activity in one place.

### Header

-   Back icon at left.
-   Centered title "Connect".
-   Add (+) icon on the right for adding a contact, invitation, or
    connection.
-   Add action should open a small action sheet or a dedicated flow, not
    trigger an unexplained immediate action.

### Family & Friends

-   Section heading with "View all".
-   A horizontally arranged group of circular avatars.
-   Each avatar includes a name and relationship label beneath it
    (examples in the image: Emma / Daughter, James / Son, Sophia /
    Granddaughter).
-   A final "Add More" avatar/button with a plus symbol.
-   Avatar circles should have consistent size and a subtle outline.
-   Support long names by wrapping or truncating safely; accessibility
    labels should contain the full name and relationship.
-   Use supplied/profile images where available and neutral placeholders
    when not.

### Upcoming Call

A highlighted card containing: - Title "Upcoming Call". - Call label,
e.g. "Video call with Emma". - Date/time. - "Join" action. - A small
illustration showing a friendly video call. - Clearly distinguish
scheduled, joinable, missed, and completed calls. - Only show "Join" as
enabled when the call is actually joinable according to the product's
timing rules. - Confirm microphone/camera permissions in context and
explain why they are needed.

### Community

-   Section heading with "View all".
-   Three compact cards:
    -   **Local Events** --- find events near you.
    -   **Volunteer** --- give time and make an impact.
    -   **Support Groups** --- connect with people who understand.
-   Each card has an icon, short label, and one-line descriptor.
-   Make the full card tappable and give each destination a clear
    accessible label.
-   Consider horizontal scrolling on small screens rather than
    compressing the text.

### Messages

-   Section title.
-   Message preview rows with:
    -   Avatar.
    -   Sender name.
    -   Message snippet.
    -   Time or date on the right.
    -   Optional unread indicator.
-   Example entries in the reference: Emma and Care Team. Treat them as
    illustrative content.
-   Tapping a row opens the conversation.
-   Unread state must be conveyed with more than color alone, such as
    bold text or a dot plus an accessible label.

### Motion

-   Family avatars can fade/scale in with a very small stagger.
-   Add More and the plus action should open a native-feeling sheet with
    a short slide-up/fade transition.
-   Upcoming call card may use a gentle entrance animation, but never a
    persistent pulsing animation that distracts the user.
-   "Join" should show a pressed/loading state, then transition into the
    call flow.
-   Message rows may use a slight pressed-state background and navigate
    with a short transition.
-   For community cards, use a small scale feedback rather than an
    exaggerated bounce.

------------------------------------------------------------------------

## 7. Bottom value-proposition row

The reference includes five cards outside the four phone mockups. Treat
these as marketing/supporting content, not as a sixth screen or an extra
bottom tab.

1.  **Privacy First** --- "Your data is secure and always private."
    -   Shield/lock icon.
    -   Link to a concise privacy explanation.
2.  **AI Companion** --- "Smart suggestions for a better today."
    -   Brain/spark icon.
    -   Explain that AI suggestions are supportive and not a replacement
        for professional care.
3.  **Future Ready** --- "Designed to adapt to your needs."
    -   Home/house icon.
    -   Communicate accessibility and extensibility.
4.  **Health Trends** --- "Track progress and stay ahead."
    -   Trend/chart icon.
    -   Link to health history if that feature exists.
5.  **Easy to Use** --- "Simple, clear and accessible design."
    -   Phone/accessibility icon.
    -   Use this as a product principle, not just a claim.

On mobile, show these as a two-column card grid or horizontal carousel
on the welcome/intro page. Do not squeeze all five into a single row on
a phone. They can be omitted from the logged-in dashboard if space is
limited.

------------------------------------------------------------------------

## 8. Navigation and information architecture

Suggested route structure:

``` text
Welcome
├── Sign In
├── Sign Up / Onboarding
└── Main App (bottom tabs)
    ├── Home
    │   ├── Wellness Check-in
    │   ├── Notifications
    │   └── Appointments
    ├── Health
    │   ├── Health History
    │   ├── Medication Details
    │   └── Health Data / Permissions
    ├── Connect
    │   ├── Contact Details
    │   ├── Add Contact
    │   ├── Video Call
    │   ├── Community
    │   └── Messages / Conversation
    ├── Services
    └── Profile
```

Use React Navigation with a bottom-tab navigator and a native stack for
detail screens. The exact navigation structure can change depending on
whether the project already uses Expo Router. **If the project already
uses Expo Router, keep it** and implement the same route hierarchy with
file-based routing instead of adding a second navigation system.

------------------------------------------------------------------------

## 9. Recommended Expo libraries

Install packages with Expo's version-aware installer wherever possible
so versions match the installed Expo SDK.

### Core UI and motion

``` bash
npx expo install react-native-reanimated
npx expo install react-native-gesture-handler
npx expo install react-native-safe-area-context
npx expo install react-native-screens
npx expo install react-native-svg
npx expo install expo-haptics
npx expo install expo-linear-gradient
```

-   **`react-native-reanimated`** --- performant card entrances,
    score-ring progress, shared-value transforms, and subtle
    interactions. Use the setup required by your installed Expo SDK.
-   **`react-native-gesture-handler`** --- reliable gesture primitives;
    especially useful if adding swipeable cards or gesture-driven
    sheets.
-   **`react-native-safe-area-context`** --- correct padding around
    notches, status bars, and home indicators.
-   **`react-native-screens`** --- native screen integration used by
    React Navigation.
-   **`react-native-svg`** --- custom circular wellness-score ring and
    simple vector illustrations.
-   **`expo-haptics`** --- restrained tactile feedback on important
    actions.
-   **`expo-linear-gradient`** --- optional, for very subtle warm
    surface gradients; the reference is mostly flat and should not be
    made overly glossy.

### Icons

``` bash
npm install lucide-react-native
npx expo install react-native-svg
```

Use `lucide-react-native` for consistent line icons. Keep icon sizes and
stroke widths consistent. The reference's icons are delicate; avoid
mixing emoji, filled icons, and multiple icon families throughout the
interface. Emoji can remain in the greeting if desired.

### Navigation --- choose one approach

**Option A: Expo Router (recommended for a new Expo project)**

``` bash
npx expo install expo-router
npx expo install expo-linking expo-constants expo-status-bar
```

Follow the current Expo Router installation guide for the project's SDK
and configure the `app/` directory. Expo templates may already include
some dependencies.

**Option B: React Navigation (if the project already uses it)**

``` bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

Do not install both navigation approaches just to reproduce this design.
Reuse the existing project architecture.

### Optional, depending on product scope

``` bash
npx expo install expo-notifications
npx expo install expo-image
npx expo install expo-local-authentication
npx expo install expo-secure-store
```

-   **`expo-notifications`** --- medication reminders, appointment
    reminders, and call notifications. Permission and platform
    configuration are required; test on physical devices.
-   **`expo-image`** --- performant avatar/illustration rendering and
    caching.
-   **`expo-local-authentication`** --- optional biometric
    re-authentication for sensitive areas, if the product requires it.
-   **`expo-secure-store`** --- small secrets or sensitive local tokens;
    not a general database and not a replacement for secure server-side
    authorization.

### Fonts (optional)

``` bash
npx expo install expo-font
npx expo install @expo-google-fonts/dm-sans @expo-google-fonts/lora
```

Use DM Sans for UI and Lora for the "Eldora" brand title if the look
matches. A bundled font improves consistency, but do not block the first
implementation on font selection.

### Optional bottom sheets

If a proper sheet is needed for Add Contact or action menus, choose a
library compatible with the current Expo SDK and gesture setup, such as
`@gorhom/bottom-sheet`. Check its current installation requirements
before adding it; a simple React Native `Modal` may be enough for this
design.

### Avoid unnecessary dependencies

-   Do not add a charting package just for the single score ring; SVG is
    sufficient.
-   Do not add a full animation framework beyond Reanimated unless the
    project genuinely needs it.
-   Do not add a UI kit if you intend to implement the custom visual
    system closely.
-   Verify package compatibility against the Expo SDK already in the
    repository before changing dependencies.

------------------------------------------------------------------------

## 10. Suggested component architecture

A maintainable component structure could look like this:

``` text
src/
  components/
    AppScreen.tsx
    ScreenHeader.tsx
    PrimaryButton.tsx
    SectionHeader.tsx
    BottomTabBar.tsx          # only if not using navigator-provided tabs
    ShortcutCard.tsx
    FeatureCard.tsx
    Avatar.tsx
    AvatarRow.tsx
    MetricRow.tsx
    WellnessScoreRing.tsx
    AppointmentCard.tsx
    MedicationReminderCard.tsx
    MessagePreviewRow.tsx
    EmptyState.tsx
    LoadingSkeleton.tsx
  features/
    onboarding/
      WelcomeScreen.tsx
    home/
      HomeScreen.tsx
      WellnessCheckInScreen.tsx
    health/
      HealthScreen.tsx
      HealthHistoryScreen.tsx
      MedicationDetailsScreen.tsx
    connect/
      ConnectScreen.tsx
      ContactDetailsScreen.tsx
      MessagesScreen.tsx
    services/
      ServicesScreen.tsx
    profile/
      ProfileScreen.tsx
  navigation/                 # omit if using Expo Router
  theme/
    colors.ts
    spacing.ts
    typography.ts
    radii.ts
    shadows.ts
  assets/
    images/
    illustrations/
```

The structure is illustrative. Keep the project's current conventions if
it already has a working architecture.

### Shared component requirements

-   `AppScreen`: safe-area handling, background color, and optional
    scroll behavior.
-   `ScreenHeader`: consistent icon hit areas, title alignment, and
    accessibility labels.
-   `SectionHeader`: heading plus optional "View all" action.
-   `PrimaryButton`: consistent radius, height, pressed state, disabled
    state, and loading state.
-   `ShortcutCard`: reusable icon tile, title, descriptor, and
    whole-card press handling.
-   `WellnessScoreRing`: score, progress, label, and accessible textual
    equivalent.
-   `Avatar`: image/fallback, border, accessible name, and consistent
    dimensions.
-   `EmptyState` / `LoadingSkeleton`: prevent blank or jumpy layouts
    when data is unavailable.

Keep components data-driven. For example, render the six Home shortcuts
from a typed data array instead of duplicating six separate blocks.

------------------------------------------------------------------------

## 11. Motion system --- recommended defaults

The concept uses soft, calm surfaces, so motion should be **subtle and
purposeful**. These are initial values to tune on device, not strict
requirements.

  ------------------------------------------------------------------------
  Interaction           Suggested motion                 Starting duration
  --------------------- --------------------- ----------------------------
  Screen entry          Fade + translateY                      250--400 ms
                        10--16 px             

  Card stagger          40--80 ms delay                                ---
                        between cards         

  Button press          Scale to 0.98,                         100--160 ms
                        restore smoothly      

  Modal / bottom sheet  Slide up + fade                        220--300 ms

  Tab change            Short crossfade or                     180--250 ms
                        native transition     

  Score ring            Animate progress once                  600--900 ms
                        on entry              

  Check-in result       Crossfade + tiny                       180--260 ms
                        scale                 

  Message row press     Subtle surface tint                    100--160 ms

  Loading skeleton      Gentle low-contrast                            ---
                        shimmer or static     
                        placeholder           
  ------------------------------------------------------------------------

### Motion principles

1.  Animate opacity and transforms before animating layout dimensions.
2.  Avoid large spring overshoots, repeated bouncing, or perpetual
    motion.
3.  Avoid animating every card each time a component re-renders.
4.  Use stable keys and keep animation state local to the component that
    needs it.
5.  Provide reduced-motion behavior; where possible, respect the OS
    accessibility preference.
6.  Never use motion alone to indicate a health alert, medication state,
    unread message, or success.
7.  Use haptics sparingly and only for meaningful actions; do not
    vibrate on every tab or scroll.
8.  Keep the UI usable if animations are disabled or reduced.

### Reanimated implementation sketch

``` tsx
// Example pattern only; adapt to your installed Reanimated version.
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const cardEntering = FadeInDown.duration(320);

// Use on a card:
// <Animated.View entering={cardEntering}>...</Animated.View>

// For a press interaction, animate a shared value to 0.98 while pressed,
// then return to 1.0. Ensure press handling remains accessible.
```

Check the Reanimated documentation for the exact APIs and Babel/plugin
setup for your installed Expo SDK. Newer Expo templates may configure
the necessary plugin automatically.

------------------------------------------------------------------------

## 12. Responsive layout and device handling

The reference board is wide because it displays several screens at once.
Each screen in the actual app must work independently.

-   Test at least a small phone, a typical modern phone, and a large
    phone.
-   Use `useWindowDimensions()` or responsive styles where layout
    decisions depend on width.
-   Keep page padding around 16--20 px on phones.
-   Use `ScrollView` for content that can exceed screen height, with the
    tab bar outside the scrolling content.
-   Do not use absolute positioning for major content blocks. Reserve it
    for decorative illustrations or small badges.
-   Use `flexWrap` or a responsive grid for shortcuts and feature cards.
-   For narrow widths, move from three shortcut columns to two if labels
    become cramped.
-   Keep tap targets at least approximately 44 × 44 points wherever
    practical.
-   Make text scale gracefully with system font-size settings; do not
    hard-code text containers that clip enlarged text.
-   Use `SafeAreaView` from `react-native-safe-area-context` or the
    project's current safe-area pattern.
-   Use `KeyboardAvoidingView` or a suitable keyboard-aware pattern for
    forms and chat.
-   Confirm the bottom tab bar does not overlap content or the home
    indicator.

------------------------------------------------------------------------

## 13. Accessibility requirements

This is a senior-friendly care app, so accessibility is part of the core
design.

-   Use strong text/background contrast; do not use pale peach text on
    pale peach cards.
-   Give every icon-only control an `accessibilityLabel` and appropriate
    role.
-   Make card touch areas generous and consistent.
-   Ensure text remains usable with larger system font settings.
-   Do not communicate selected, unread, overdue, or success states
    through color alone.
-   Give the score ring a textual label, score, and explanation that
    screen readers can announce.
-   Add meaningful labels to avatar images and video-call controls.
-   Keep navigation order logical and avoid focus traps in modals.
-   Respect reduced motion and screen-reader settings.
-   Use plain language, short sentences, and clear error recovery.
-   Provide confirmation for medication actions and other consequential
    interactions.

------------------------------------------------------------------------

## 14. Data, privacy, and product integrity

The reference contains sample names, dates, health values, and messages.
Treat all of them as **mock content** until backed by real product data.

-   Keep mock data separate from UI components so it can be replaced
    cleanly.
-   Never hard-code sample health values as if they are live
    measurements.
-   Do not imply the wellness score is a clinical diagnosis.
-   Ask for only the permissions needed for a feature, at the moment the
    user needs it.
-   Use secure transport and appropriate server-side authorization for
    personal data.
-   Avoid putting secrets or service-role keys in the mobile app bundle.
-   Show clear loading, empty, permission-denied, stale-data, and error
    states.
-   Use realistic test data for development, but never commit real
    personal health information.
-   Make privacy and AI limitations understandable from the UI.

------------------------------------------------------------------------

## 15. Implementation order

A practical sequence for building this design:

1.  **Audit the existing Expo project** --- identify SDK version,
    TypeScript status, navigation system, and current design
    dependencies.
2.  **Create theme tokens** --- colors, spacing, radii, typography, and
    shadows.
3.  **Build the shared shell** --- safe area, screen background, header,
    buttons, section headings, and bottom tabs.
4.  **Build Welcome** --- hero, benefit cards, CTA, sign-in route.
5.  **Build Home** --- greeting, wellness card, shortcuts, upcoming
    appointment.
6.  **Build Health** --- score ring, metric rows, insights, medication
    reminder, tip.
7.  **Build Connect** --- avatar row, upcoming call, community cards,
    message previews.
8.  **Wire navigation and realistic mock data** --- ensure all
    cards/actions do something.
9.  **Add motion** --- screen entrances, presses, score ring, sheet
    transitions, reduced-motion handling.
10. **Add loading/empty/error states** --- verify that missing data does
    not break the design.
11. **Test accessibility and responsive layouts** --- larger text,
    screen reader, narrow devices, safe areas.
12. **Polish against the reference** --- compare spacing, card sizes,
    icon weight, text hierarchy, and visual balance on a real device.

------------------------------------------------------------------------

## 16. Acceptance checklist

### Visual fidelity

-   [ ] Warm ivory canvas and off-white cards are consistent.
-   [ ] Deep green is reserved for primary actions and active states.
-   [ ] Peach and pale green are used as soft accents, not dominant
    high-saturation fills.
-   [ ] Rounded cards, subtle borders, and restrained shadows match the
    reference.
-   [ ] Icons use one consistent line style.
-   [ ] Brand title has the intended editorial feel without sacrificing
    readability.

### Screen content

-   [ ] Welcome includes brand, headline, description, three benefits,
    CTA, and sign-in.
-   [ ] Home includes greeting, daily wellness, six shortcuts,
    appointment, and bottom tabs.
-   [ ] Health includes overview score, four metric rows, insights,
    medication reminder, tip, and tabs.
-   [ ] Connect includes family avatars, upcoming call, community cards,
    messages, and tabs.
-   [ ] Bottom value propositions are used in an appropriate
    intro/marketing location, not forced into every screen.

### Functionality

-   [ ] Every visible button/card has a real action or is clearly
    disabled.
-   [ ] Navigation selection matches the current route.
-   [ ] Empty, loading, error, and permission states exist.
-   [ ] Sample values are not represented as real data.
-   [ ] No secret keys are embedded in the app.

### Motion and accessibility

-   [ ] Motion is subtle, short, and purposeful.
-   [ ] Animations do not restart unexpectedly on re-render.
-   [ ] Reduced-motion behavior is supported.
-   [ ] Icon-only controls have accessible labels.
-   [ ] Text scaling and screen readers are tested.
-   [ ] Touch targets and safe-area spacing are verified.

------------------------------------------------------------------------

## 17. Final implementation note

Use the supplied image as a **visual reference**, not as a source of
exact pixel measurements. The reference is a compressed presentation
composite, so some text and measurements are approximate. Prioritize the
same hierarchy, palette, card rhythm, and calm emotional tone while
making the actual app readable and functional on real devices. Start by
matching the layout with static mock data, then add navigation, real
data, and motion in separate passes.
