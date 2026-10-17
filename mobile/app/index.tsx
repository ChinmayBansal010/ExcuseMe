import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Activity, AudioLines, BrainCircuit, Check, ChevronRight, CircleAlert, FileText,
  Languages, Moon, Sparkles, Sun,
} from "lucide-react-native";
import { Panel } from "@/components/Panel";
import { SectionTitle } from "@/components/SectionTitle";
import { OrbitScene } from "@/components/OrbitScene";
import { analyzeText, compareTexts, healthCheck, Operation } from "@/lib/api";
import { colors as baseColors } from "@/theme/colors";
import { useAppTheme, type ThemeColors } from "@/theme/ThemeContext";

const TOOLS: { id: Operation; title: string; desc: string; icon: any; tint: string }[] = [
  { id: "language", title: "Language ID", desc: "Detect language and alternatives", icon: Languages, tint: baseColors.orange },
  { id: "sentiment", title: "Sentiment", desc: "Positive or negative tone", icon: Activity, tint: baseColors.blue },
  { id: "emotion", title: "Emotion map", desc: "Rank emotional signals", icon: AudioLines, tint: baseColors.purple },
  { id: "summary", title: "Summarize", desc: "Compress long passages", icon: FileText, tint: baseColors.purple },
  { id: "excuse", title: "Explanation quality", desc: "AI feedback on clarity, detail, completeness and consistency", icon: BrainCircuit, tint: baseColors.red },
];

const DEMO = "I was going to submit the assignment yesterday, but my laptop stopped working right before the deadline. I contacted my teammate and promised to send the file this evening.";
const MAX_TEXT_CHARS = 20000;

function keywordBarWidth(score: unknown, keywords: any[]): string {
  const numericScores = (Array.isArray(keywords) ? keywords : []).map((item) => Number(item?.score) || 0);
  const maxScore = Math.max(0.0001, ...numericScores);
  const numericScore = Number(score) || 0;
  return `${Math.max(3, Math.min(100, (numericScore / maxScore) * 100))}%`;
}

function pretty(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function ResultSkeleton({ colors, styles }: { colors: ThemeColors; styles: any }) {
  return (
    <View style={styles.resultsWrap} accessibilityLabel="Loading results" accessibilityRole="progressbar">
      <View style={{ gap: 7 }}>
        <View style={[styles.skeletonLine, { width: 156, height: 18, backgroundColor: colors.panel2 }]} />
        <View style={[styles.skeletonLine, { width: 248, backgroundColor: colors.panel2 }]} />
      </View>
      {[0, 1, 2].map((card) => (
        <Panel key={card} style={styles.resultPanel}>
          <View style={[styles.skeletonLine, { width: 112, height: 10, backgroundColor: colors.panel2, marginBottom: 15 }]} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            {[0, 1, 2, 3].map((item) => <View key={item} style={{ flexGrow: 1, flexBasis: 100, gap: 8, padding: 12, borderRadius: 10, backgroundColor: colors.panel2 }}><View style={[styles.skeletonLine, { width: "55%", backgroundColor: colors.border }]} /><View style={[styles.skeletonLine, { width: "82%", height: 19, backgroundColor: colors.border }]} /></View>)}
          </View>
          <View style={[styles.skeletonLine, { width: "94%", marginTop: 13, backgroundColor: colors.panel2 }]} />
          <View style={[styles.skeletonLine, { width: "68%", marginTop: 8, backgroundColor: colors.panel2 }]} />
        </Panel>
      ))}
      <Text style={styles.counter}>Running the selected models…</Text>
    </View>
  );
}

function DetailRow({ label, value, styles }: { label: string; value: any; styles: any }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label.replaceAll("_", " ")}</Text><Text selectable style={styles.detailValue}>{typeof value === "object" && value !== null ? pretty(value) : String(value ?? "—")}</Text></View>;
}

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();
  const [splashVisible, setSplashVisible] = useState(true);
  const ThemeIcon = isDark ? Sun : Moon;
  const [text, setText] = useState(DEMO);
  const [selected, setSelected] = useState<Operation[]>(["excuse", "sentiment", "emotion"]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(false);
  const [tab, setTab] = useState<"analyze" | "compare">("analyze");
  const [textB, setTextB] = useState("I couldn't finish it because my computer crashed.");
  const [secondary, setSecondary] = useState<any>(null);
  const [toolSearch, setToolSearch] = useState("");
  const [activePreset, setActivePreset] = useState("excuse");
  const [recentAnalyses, setRecentAnalyses] = useState<{ id: string; text: string; operations: Operation[]; timestamp: string }[]>([]);
  const [messageReason, setMessageReason] = useState("");
  const [messageAudience, setMessageAudience] = useState<"teacher" | "manager" | "friend">("teacher");
  const [messageTone, setMessageTone] = useState<"polite" | "formal" | "casual">("polite");
  const [generatedMessage, setGeneratedMessage] = useState("");

  useEffect(() => {
    healthCheck().then(setOnline).catch(() => setOnline(false));
    const splashTimer = setTimeout(() => setSplashVisible(false), 900);
    return () => clearTimeout(splashTimer);
  }, []);

  const chosenCount = selected.length;
  const filteredTools = TOOLS.filter((tool) =>
  `${tool.title} ${tool.desc} ${tool.id}`
    .toLowerCase()
    .includes(toolSearch.toLowerCase().trim())
  );
  const shareResult = async () => {
    if (!result) return;
    try {
      await Share.share({
        title: "ExcuseMoi analysis",
        message: JSON.stringify({ text, results: result.results, warnings: result.warnings }, null, 2),
      });
    } catch (error: any) {
      Alert.alert("Share failed", error?.message || "Could not share the analysis result.");
    }
  };

  const toggle = (id: Operation) => {
    setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const runAnalysis = async () => {
    if (!text.trim()) return Alert.alert("Text required", "Paste or type some text first.");
    if (text.length > MAX_TEXT_CHARS) return Alert.alert("Text too long", "Keep the input under 20,000 characters.");
    if (!selected.length) return Alert.alert("Choose a tool", "Select at least one NLP operation.");
    setLoading(true);
    setResult(null);
    try {
      const payload = await analyzeText(text, selected);
      setResult(payload);
      setRecentAnalyses((items) => [
        { id: `${Date.now()}-${text.length}`, text, operations: [...selected], timestamp: new Date().toLocaleTimeString() },
        ...items.filter((item) => item.text !== text),
      ].slice(0, 5));
    } catch (error: any) {
      Alert.alert("Analysis failed", error.message || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  };

  const runCompare = async () => {
    if (!text.trim() || !textB.trim()) return Alert.alert("Both texts required", "Enter two passages.");
    if (text.length > MAX_TEXT_CHARS || textB.length > MAX_TEXT_CHARS) {
      return Alert.alert("Text too long", "Each passage must be under 20,000 characters.");
    }
    setLoading(true);
    setSecondary(null);
    try {
      setSecondary(await compareTexts(text, textB));
    } catch (error: any) {
      Alert.alert("Comparison failed", error.message || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  };

  const resultCards = useMemo(() => result?.results ? Object.entries(result.results) : [], [result]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const applyPreset = (preset: "excuse" | "profile" | "emotion") => {
    setActivePreset(preset);
    const presets: Record<string, Operation[]> = { excuse: ["excuse"], profile: ["language", "summary"], emotion: ["sentiment", "emotion"] };
    setSelected(presets[preset]);
    setTab("analyze");
  };
  const loadCase = (value: string) => { setText(value); setResult(null); setTab("analyze"); };
  const buildMessage = () => {
    const reason = messageReason.trim();
    if (!reason) return Alert.alert("Add a reason", "Write a short, honest explanation first.");
    const opening = messageAudience === "teacher" ? "Hi, I wanted to let you know" : messageAudience === "manager" ? "Hello, I wanted to update you" : "Hey, just wanted to let you know";
    const request = messageAudience === "teacher" ? "Could you please let me know what the best next step would be?" : messageAudience === "manager" ? "Please let me know how you would like me to proceed." : "Let me know what works for you.";
    const closing = messageTone === "formal" ? "I apologise for the inconvenience and appreciate your understanding." : messageTone === "casual" ? "Sorry about the trouble, and thanks for understanding." : "I'm sorry for the inconvenience, and I appreciate your understanding.";
    const body = messageTone === "formal" ? `${opening} that ${reason.replace(/[.!?]+$/, "")}. ${request} ${closing}` : `${opening} that ${reason.replace(/[.!?]+$/, "")}. ${closing} ${request}`;
    setGeneratedMessage(body);
  };
  const shareGeneratedMessage = async () => {
    if (!generatedMessage) return;
    try {
      await Share.share({ title: "Message draft", message: generatedMessage });
    } catch (error: any) {
      Alert.alert("Share failed", error?.message || "Could not share the message.");
    }
  };

  if (splashVisible) {
    return (
      <SafeAreaView style={styles.splash}>
        <View style={styles.splashBrandMark}><Sparkles size={28} color={colors.bg} /></View>
        <Text style={styles.splashBrand}>ExcuseMoi<Text style={styles.dot}>.</Text></Text>
        <Text style={styles.splashTagline}>Language, intent, context.</Text>
        <View style={styles.splashTrack}><View style={styles.splashProgress} /></View>
        <Text style={styles.splashCaption}>EXCUSEMOI · TEXT STUDIO</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.page, { paddingHorizontal: width < 480 ? 12 : width < 900 ? 20 : 28 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.topbar}>
          <View style={styles.brandMark}><Sparkles size={21} color={colors.bg} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>ExcuseMoi<Text style={styles.dot}>.</Text></Text>
            <Text style={styles.eyebrow}>YOUR TEXT, UNDERSTOOD</Text>
          </View>
          <View style={[styles.status, { borderColor: online ? "#3A5330" : colors.border }]}>
            <View style={[styles.statusDot, { backgroundColor: online ? colors.green : colors.red }]} />
            <Text style={styles.statusText}>{width < 380 ? (online ? "ONLINE" : "OFFLINE") : (online ? "API ONLINE" : "API OFFLINE")}</Text>
          </View>
          <Pressable onPress={toggleTheme} accessibilityRole="button" accessibilityLabel={isDark ? "Switch to light theme" : "Switch to dark theme"} style={styles.themeToggle}>
            <ThemeIcon size={17} color={colors.text} />
            {width >= 380 ? <Text style={styles.themeToggleText}>{isDark ? "LIGHT" : "DARK"}</Text> : null}
          </Pressable>
        </View>

        <View style={[styles.hero, width >= 760 && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>LINGUISTIC DECEPTION & EXCUSE PLAUSIBILITY</Text>
            <Text style={[styles.headline, width < 480 && { fontSize: 32, lineHeight: 35 }]}>Read the cues.{"\n"}<Text style={styles.headlineAccent}>Not minds.</Text></Text>
            <Text style={styles.subtitle}>Explore how explanations are worded — without pretending to detect lies.</Text>
            <View style={styles.heroMeta}><View style={styles.metaChip}><Text style={styles.metaChipText}>LINGUISTIC CUES</Text></View><View style={styles.metaChip}><Text style={styles.metaChipText}>TEXT COMPARISON</Text></View></View>
          </View>
          {width >= 760 ? <View style={styles.heroVisual}><OrbitScene dark={isDark} /><View style={styles.visualCaption}><Text style={styles.visualCaptionTitle}>LANGUAGE, IN CONTEXT</Text><Text style={styles.visualCaptionText}>Cues · structure · meaning</Text></View></View> : null}
        </View>

        <View style={styles.tabs}>
          {([
            ["analyze", "Analyze"],
            ["compare", "Compare"],
          ] as const).map(([key, title]) => (
            <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{title}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.liveMetrics}>
          <View style={styles.liveMetric}><Text style={styles.liveMetricValue}>{text.trim() ? text.trim().split(" ").filter(Boolean).length.toLocaleString() : "0"}</Text><Text style={styles.liveMetricLabel}>WORDS</Text></View>
          <View style={styles.liveMetric}><Text style={styles.liveMetricValue}>{text.trim() ? (text.match(/[.!?]/g) || []).length.toLocaleString() : "0"}</Text><Text style={styles.liveMetricLabel}>SENTENCE MARKS</Text></View>
          <View style={styles.liveMetric}><Text style={styles.liveMetricValue}>{text.trim() ? String(Math.max(1, Math.ceil(text.trim().split(" ").filter(Boolean).length / 200))) + " MIN" : "—"}</Text><Text style={styles.liveMetricLabel}>READ TIME</Text></View>
          <View style={styles.liveMetric}><Text style={styles.liveMetricValue}>{text.length.toLocaleString()}</Text><Text style={styles.liveMetricLabel}>CHARACTERS</Text></View>
        </View>

        <View style={styles.focusSection}>
          <View style={styles.focusHeading}><Text style={styles.focusTitle}>Start with a focus</Text><Text style={styles.focusHint}>PICK A LENS</Text></View>
          <View style={styles.presetRow}>
            {([["excuse", "Explanation quality", "Clarity · detail · completeness"], ["profile", "Language & summary", "Identify language · summarize text"], ["emotion", "Tone & emotion", "Understand the emotional tone"]] as const).map(([key, title, detail]) => (
              <Pressable key={key} onPress={() => applyPreset(key)} style={({ pressed }) => [styles.presetCard, activePreset === key && styles.presetCardActive, pressed && styles.pressed]}>
                <View style={[styles.presetMark, activePreset === key && styles.presetMarkActive]}>
                  {key === "excuse" ? <BrainCircuit size={18} color={activePreset === key ? colors.bg : colors.red} /> : key === "profile" ? <Languages size={18} color={activePreset === key ? colors.bg : colors.blue} /> : <AudioLines size={18} color={activePreset === key ? colors.bg : colors.purple} />}
                </View>
                <Text style={styles.presetTitle}>{title}</Text>
                {width >= 600 ? <Text style={styles.presetDetail}>{detail}</Text> : null}
                <Text style={[styles.presetAction, activePreset === key && styles.presetActionActive]}>{activePreset === key ? "SELECTED" : "USE FOCUS  ↗"}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.caseSection}>
          <View style={styles.focusHeading}><Text style={styles.focusTitle}>Try a case</Text><Text style={styles.focusHint}>SAMPLE TEXT</Text></View>
          <View style={styles.caseRow}>
            {([["Deadline", "My laptop failed just before the deadline, so I asked my teammate to send the file later."], ["Missed meeting", "I lost track of time and missed the meeting. I should have messaged earlier."], ["Changed plans", "Something came up at home, and I will not be able to make it today. Can we reschedule?"]] as const).map(([title, sample]) => (
              <Pressable key={title} onPress={() => loadCase(sample)} style={({ pressed }) => [styles.caseChip, pressed && styles.pressed]}>
                <Text style={styles.caseChipTitle}>{title}</Text><ChevronRight size={14} color={colors.accent} />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.caseSection}>
          <View style={styles.focusHeading}><Text style={styles.focusTitle}>Write a clear message</Text><Text style={styles.focusHint}>MESSAGE BUILDER</Text></View>
          <Panel>
            <SectionTitle title="Explain it in your own words" detail="Build a respectful draft from an honest reason. Review it before sending." />
            <TextInput
              value={messageReason}
              onChangeText={setMessageReason}
              multiline
              textAlignVertical="top"
              placeholder="e.g. My train was delayed and I will arrive 20 minutes late"
              placeholderTextColor={colors.muted}
              style={[styles.textArea, { minHeight: 76 }]}
            />
            <Text style={styles.fieldLabel}>QUICK STARTERS</Text>
            <View style={styles.caseRow}>
              {([
                ["Running late", "I am running late because my train was delayed"],
                ["Need an extension", "I need a little more time to finish the work properly"],
                ["Reschedule", "I cannot make our planned time and would like to reschedule"],
              ] as const).map(([label, reason]) => (
                <Pressable key={label} onPress={() => setMessageReason(reason)} style={styles.builderOption}>
                  <Text style={styles.builderOptionText}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>WHO IS IT FOR?</Text>
            <View style={styles.caseRow}>
              {([["teacher", "Teacher / lecturer"], ["manager", "Manager / colleague"], ["friend", "Friend"]] as const).map(([value, label]) => (
                <Pressable key={value} onPress={() => setMessageAudience(value)} style={[styles.builderOption, messageAudience === value && styles.builderOptionActive]}>
                  <Text style={[styles.builderOptionText, messageAudience === value && styles.builderOptionTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>TONE</Text>
            <View style={styles.caseRow}>
              {([["polite", "Polite"], ["formal", "Formal"], ["casual", "Casual"]] as const).map(([value, label]) => (
                <Pressable key={value} onPress={() => setMessageTone(value)} style={[styles.builderOption, messageTone === value && styles.builderOptionActive]}>
                  <Text style={[styles.builderOptionText, messageTone === value && styles.builderOptionTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={buildMessage} style={styles.primaryButton}>
              <WandSparkles size={17} color={colors.bg} /><Text style={styles.primaryButtonText}>Create message draft</Text>
            </Pressable>
            {generatedMessage ? (
              <View style={styles.generatedMessage}>
                <Text style={styles.resultBody}>{generatedMessage}</Text>
                <View style={styles.panelActions}>
                  <Pressable onPress={() => { setText(generatedMessage); setResult(null); setTab("analyze"); }}><Text style={styles.actionText}>ANALYZE DRAFT</Text></Pressable>
                  <Pressable onPress={shareGeneratedMessage}><Text style={styles.actionText}>SHARE DRAFT</Text></Pressable>
                  <Pressable onPress={() => setGeneratedMessage("")}><Text style={styles.actionText}>DISMISS</Text></Pressable>
                </View>
              </View>
            ) : null}
          </Panel>
        </View>
        {recentAnalyses.length > 0 ? (
          <View style={styles.caseSection}>
            <View style={styles.focusHeading}><Text style={styles.focusTitle}>Recent analyses</Text><Pressable onPress={() => setRecentAnalyses([])}><Text style={styles.actionText}>CLEAR HISTORY</Text></Pressable></View>
            <View style={styles.caseRow}>
              {recentAnalyses.map((item) => (
                <Pressable key={item.id} onPress={() => { setText(item.text); setSelected(item.operations); setTab("analyze"); setResult(null); }} style={({ pressed }) => [styles.caseChip, pressed && styles.pressed]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.caseChipTitle} numberOfLines={1}>{item.text}</Text>
                    <Text style={styles.counter}>{item.operations.length} tools · {item.timestamp}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.accent} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {tab === "analyze" ? (
          <>
            <Panel>
              <View style={styles.panelHeader}>
                <SectionTitle title="Examine an explanation" detail="Paste text or load a case above." />
                <View style={styles.panelActions}>
                  <Pressable onPress={() => setText(DEMO)}><Text style={styles.actionText}>LOAD DEMO</Text></Pressable>
                  <Pressable onPress={() => setText("")}><Text style={styles.actionText}>CLEAR</Text></Pressable>
                </View>
              </View>
              <TextInput
                value={text}
                onChangeText={setText}
                maxLength={MAX_TEXT_CHARS}
                multiline
                textAlignVertical="top"
                placeholder="Paste text to analyze..."
                placeholderTextColor={colors.muted}
                style={styles.textArea}
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.counter, text.length >= MAX_TEXT_CHARS && styles.counterLimit]}>
                  {text.length.toLocaleString()} / 20,000 characters
                </Text>
                <Text style={styles.counter}>INPUT LIMIT</Text>
              </View>
            </Panel>

            <View style={styles.sectionRow}>
              <SectionTitle
                title="Choose what to learn"
                detail={`${chosenCount} selected`}
              />
              <View style={styles.panelActions}>
                <Pressable onPress={() => setSelected(TOOLS.map((t) => t.id))}>
                  <Text style={styles.actionText}>SELECT ALL</Text>
                </Pressable>
                <Pressable onPress={() => setSelected([])}>
                  <Text style={styles.actionText}>CLEAR ALL</Text>
                </Pressable>
              </View>
            </View>

            <TextInput
              value={toolSearch}
              onChangeText={setToolSearch}
              placeholder="Find a feature..."
              placeholderTextColor={colors.muted}
              style={styles.singleInput}
            />

            {filteredTools.length === 0 ? (
              <Text style={styles.emptyText}>No tools match “{toolSearch}”. Try another search.</Text>
            ) : null}

            <View style={styles.toolGrid}>
              {filteredTools.map((tool) => {
                const active = selected.includes(tool.id);
                const Icon = tool.icon;
                return (
                  <Pressable key={tool.id} onPress={() => toggle(tool.id)} style={[styles.toolCard, { width: width < 560 ? "100%" : width < 900 ? "48%" : "32%" }, active && styles.toolCardActive]}>
                    <View style={[styles.toolIcon, { backgroundColor: `${tool.tint}18` }]}><Icon size={19} color={tool.tint} /></View>
                    <View style={styles.toolInfo}>
                      <Text style={styles.toolTitle}>{tool.title}</Text>
                      <Text style={styles.toolDesc}>{tool.desc}</Text>
                    </View>
                    <View style={[styles.checkbox, active && styles.checkboxActive]}>{active ? <Check size={12} color={colors.bg} /> : null}</View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={runAnalysis} disabled={loading} style={[styles.primaryButton, loading && { opacity: 0.65 }]}>
              {loading ? <ActivityIndicator color={colors.bg} /> : <Sparkles size={18} color={colors.bg} />}
              <Text style={styles.primaryButtonText}>{loading ? "Reviewing your text..." : "Review explanation"}</Text>
              {!loading ? <ChevronRight size={18} color={colors.bg} /> : null}
            </Pressable>

            {loading && !result ? <ResultSkeleton colors={colors} styles={styles} /> : null}
            {result ? (
              <View style={styles.resultsWrap}>
                <View style={styles.resultHeaderRow}>
                  <SectionTitle title="Analysis results" detail="Predictions and linguistic measurements from the selected tools." />
                  <Pressable onPress={shareResult}><Text style={styles.actionText}>SHARE JSON</Text></Pressable>
                </View>
                {resultCards.map(([key, value]: any) => (
                  <Panel key={key} style={styles.resultPanel}>
                    <Text style={styles.resultTitle}>{String(key).replaceAll("_", " ").toUpperCase()}</Text>
                    {key === "stats" && value ? (
                      <View style={styles.metricGrid}>
                        {[
                          ["WORDS", value.words], ["SENTENCES", value.sentences],
                          ["UNIQUE RATIO", value.unique_word_ratio], ["READABILITY", value.flesch_reading_ease],
                        ].map(([label, val]) => (
                          <View key={String(label)} style={styles.metricBox}>
                            <Text style={styles.metricValue}>{String(val)}</Text><Text style={styles.metricLabel}>{label}</Text>
                          </View>
                        ))}
                      </View>
                    ) : key === "sentiment" ? (
                      <View style={styles.predictionRow}>
                        <Text style={styles.predictionMain}>{value.prediction}</Text>
                        <Text style={styles.scorePill}>{Math.round(value.score * 100)}% model score</Text>
                      </View>
                    ) : key === "emotion" ? (
                      <View style={{ gap: 9 }}>
                        {(value.predictions || []).map((p: any) => (
                          <View key={p.label} style={styles.barRow}>
                            <Text style={styles.barLabel}>{p.label}</Text>
                            <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max(2, p.score * 100)}%` }]} /></View>
                            <Text style={styles.barScore}>{Math.round(p.score * 100)}%</Text>
                          </View>
                        ))}
                      </View>
                    ) : key === "language" ? (
                      <View style={{ gap: 12 }}>
                        <View style={styles.languageHero}><Languages size={22} color={colors.accent} /><View style={{ flex: 1 }}><Text style={styles.metricLabel}>DETECTED LANGUAGE</Text><Text style={styles.languageCode}>{String(value.language_code || "unknown").toUpperCase()}</Text></View></View>
                        {(value.alternatives || []).map((item: any) => <View key={item.language} style={styles.barRow}><Text style={styles.barLabel}>{item.language}</Text><View style={styles.barTrack}><View style={[styles.barFill, { width: String(Math.max(2, item.probability * 100) + "%"), backgroundColor: colors.blue }]} /></View><Text style={styles.barScore}>{Math.round(item.probability * 100)}%</Text></View>)}
                        {value.note ? <Text style={styles.resultBody}>{value.note}</Text> : null}
                      </View>
                    ) : key === "summary" ? (
                      <View style={{ gap: 10 }}><Text style={styles.resultBody}>{value.summary}</Text>{value.note ? <Text style={styles.counter}>{value.note}</Text> : null}{value.model ? <Text style={styles.counter}>Model: {value.model}</Text> : null}</View>
                    ) : (
                      <View style={{ gap: 8 }}>{Object.entries(value || {}).filter(([field]) => field !== "model").map(([field, detail]) => <DetailRow key={field} label={field} value={detail} styles={styles} />)}{value.model ? <Text style={styles.counter}>Model: {value.model}</Text> : null}</View>
                    )}
                  </Panel>
                ))}
                <Text style={styles.disclaimer}>Outputs are model predictions, not facts. Linguistic cues cannot establish truth or deception.</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {tab === "compare" ? (
          <>
            <Panel>
              <SectionTitle title="Compare explanations" detail="Compare two versions to see how their meaning differs." />
              <Text style={styles.fieldLabel}>TEXT A</Text>
              <TextInput value={text} onChangeText={setText} maxLength={MAX_TEXT_CHARS} multiline textAlignVertical="top" style={styles.textArea} placeholderTextColor={colors.muted} />
              <Text style={styles.fieldLabel}>TEXT B</Text>
              <TextInput value={textB} onChangeText={setTextB} maxLength={MAX_TEXT_CHARS} multiline textAlignVertical="top" style={styles.textArea} placeholderTextColor={colors.muted} />
              <Pressable onPress={runCompare} disabled={loading} style={styles.primaryButton}>
                {loading ? <ActivityIndicator color={colors.bg} /> : <Activity size={18} color={colors.bg} />}
                <Text style={styles.primaryButtonText}>Compare meaning</Text>
              </Pressable>
            </Panel>
            {loading && !secondary ? <ResultSkeleton colors={colors} styles={styles} /> : null}
            {secondary ? (
              <View style={styles.comparisonResults}>
                <Panel>
                  <Text style={styles.resultTitle}>SEMANTIC SIMILARITY</Text>
                  <View style={styles.predictionRow}>
                    <Text style={styles.bigScore}>{secondary.similarity}</Text>
                    <Text style={styles.scorePill}>{secondary.percentage}%</Text>
                  </View>
                  <Text style={styles.resultBody}>{secondary.similarity_label || "Cosine similarity"}</Text>
                  <Text style={[styles.resultBody, { marginTop: 8 }]}>{secondary.interpretation}</Text>
                </Panel>
                <SectionTitle title="Text metrics" detail="A side-by-side comparison. Delta is Text B minus Text A." />
                <View style={styles.metricGrid}>
                  {[
                    ["WORDS", "words"],
                    ["SENTENCES", "sentences"],
                    ["CHARACTERS", "characters"],
                    ["READABILITY", "flesch_reading_ease"],
                  ].map(([label, key]) => (
                    <View key={key} style={styles.comparisonCell}>
                      <Text style={styles.metricLabel}>{label}</Text>
                      <View style={styles.comparisonLine}>
                        <Text style={styles.comparisonSide}>A</Text>
                        <Text style={styles.comparisonValue}>{secondary.stats_a?.[key] ?? "—"}</Text>
                      </View>
                      <View style={styles.comparisonLine}>
                        <Text style={styles.comparisonSide}>B</Text>
                        <Text style={styles.comparisonValue}>{secondary.stats_b?.[key] ?? "—"}</Text>
                      </View>
                      <View style={styles.comparisonLine}>
                        <Text style={styles.comparisonSide}>Δ</Text>
                        <Text style={styles.comparisonDelta}>
                          {Number(secondary.differences_b_minus_a?.[key] ?? 0) > 0 ? "+" : ""}
                          {secondary.differences_b_minus_a?.[key] ?? "—"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}


        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerTitle}>EXCUSEMOI / EXPLANATION ASSISTANT</Text>
          <Text style={styles.footerText}>Understand your message. Improve clarity. Communicate better.</Text>
          <Text style={styles.footerText}>Language analysis, not a lie detector.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 28 },
  splashBrandMark: { width: 68, height: 68, borderRadius: 23, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  splashBrand: { color: colors.text, fontSize: 34, fontWeight: "800", letterSpacing: -1.2 },
  splashTagline: { color: colors.muted, fontSize: 14, marginTop: 8 },
  splashTrack: { width: 132, height: 3, borderRadius: 99, backgroundColor: colors.border, overflow: "hidden", marginTop: 34 },
  splashProgress: { width: "68%", height: 3, backgroundColor: colors.accent, borderRadius: 99 },
  splashCaption: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 2, marginTop: 17 },
  themeToggle: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 99 },
  themeToggleText: { color: colors.text, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  page: { padding: 14, paddingBottom: 32, gap: 14, maxWidth: 1320, width: "100%", alignSelf: "center" },
  topbar: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 2 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.7 },
  dot: { color: colors.accent },
  eyebrow: { color: colors.muted, fontSize: 9, letterSpacing: 1.8, marginTop: 2 },
  status: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  hero: { paddingTop: 2, paddingBottom: 0 },
  liveMetrics: { flexDirection: "row", flexWrap: "wrap", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 15, overflow: "hidden" },
  liveMetric: { flexGrow: 1, flexBasis: 100, minWidth: 0, paddingVertical: 12, paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: colors.border, gap: 4 },
  liveMetricValue: { color: colors.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.5 },
  liveMetricLabel: { color: colors.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1.2 },
  focusSection: { gap: 9 },
  caseSection: { gap: 9 },
  focusHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  focusTitle: { color: colors.text, fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  focusHint: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  presetCard: { flexGrow: 1, flexBasis: 180, minWidth: 0, padding: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 13, borderBottomWidth: 3, borderBottomColor: colors.border, gap: 7 },
  presetCardActive: { backgroundColor: colors.selected, borderColor: colors.selectedBorder, borderBottomColor: colors.accent },
  presetMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.panel2, alignItems: "center", justifyContent: "center" },
  presetMarkActive: { backgroundColor: colors.accent },
  presetTitle: { color: colors.text, fontSize: 12, fontWeight: "800" },
  presetDetail: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  presetAction: { color: colors.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.8, marginTop: 2 },
  presetActionActive: { color: colors.accent },
  caseRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  caseChip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, flexGrow: 1, flexBasis: 130, backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
  caseChipTitle: { color: colors.text, fontSize: 11, fontWeight: "700" },
  builderOption: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  builderOptionActive: { borderColor: colors.selectedBorder, backgroundColor: colors.selected },
  builderOptionText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  builderOptionTextActive: { color: colors.text },
  generatedMessage: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel2, borderRadius: 12, padding: 13, gap: 12, marginTop: 12 },
  pressed: { transform: [{ translateY: 2 }], opacity: 0.88 },
  heroWide: { flexDirection: "row", alignItems: "center", gap: 22, minHeight: 250 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroVisual: { width: "36%", minWidth: 220, maxWidth: 380, minHeight: 250, justifyContent: "center", alignItems: "center", borderRadius: 22, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  visualCaption: { alignItems: "center", marginTop: -12, paddingBottom: 14 },
  visualCaptionTitle: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  visualCaptionText: { color: colors.muted, fontSize: 11, marginTop: 5 },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 2.5, marginBottom: 9 },
  headline: { color: colors.text, fontSize: 42, lineHeight: 44, fontWeight: "800", letterSpacing: -1.8 },
  headlineAccent: { color: colors.accent },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, maxWidth: 680, marginTop: 10 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 16 },
  metaChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  metaChipText: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  tabs: { flexDirection: "row", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 4, borderRadius: 14 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: colors.panel2 },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: colors.text },
  panelHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  panelActions: { flexDirection: "row", gap: 12 },
  resultHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  actionText: { color: colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.8, paddingTop: 4 },
  textArea: { minHeight: 112, color: colors.text, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, fontSize: 14, lineHeight: 21, marginTop: 4 },
  inputFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 9 },
  counter: { color: colors.muted, fontSize: 10 },
  counterLimit: { color: colors.orange },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  toolCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 11, width: "48.5%", minHeight: 78 },
  toolCardActive: { borderColor: colors.selectedBorder, backgroundColor: colors.selected },
  toolIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  toolInfo: { flex: 1, gap: 4 },
  toolTitle: { color: colors.text, fontSize: 12, fontWeight: "700" },
  toolDesc: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  checkbox: { width: 17, height: 17, borderWidth: 1, borderColor: colors.border, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  primaryButton: { backgroundColor: colors.accent, borderRadius: 14, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, minHeight: 52, marginTop: 5 },
  primaryButtonText: { color: colors.bg, fontWeight: "800", fontSize: 13 },
  resultsWrap: { gap: 12, marginTop: 6 },
  resultPanel: { marginBottom: 0 },
  resultTitle: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginBottom: 13 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricBox: { width: "48%", backgroundColor: colors.panel2, borderRadius: 12, padding: 12 },
  metricValue: { color: colors.accent, fontSize: 23, fontWeight: "800" },
  metricLabel: { color: colors.muted, fontSize: 9, letterSpacing: 0.8, marginTop: 5 },
  comparisonResults: { gap: 12, marginTop: 14 },
  comparisonCell: { width: "48%", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 12, gap: 8 },
  comparisonLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  comparisonSide: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  comparisonValue: { color: colors.text, fontSize: 12, fontWeight: "700" },
  comparisonDelta: { color: colors.accent, fontSize: 12, fontWeight: "800" },
  predictionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  predictionMain: { color: colors.text, fontSize: 20, fontWeight: "800" },
  scorePill: { color: colors.accent, fontSize: 10, fontWeight: "700", backgroundColor: colors.pill, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, overflow: "hidden" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 86, color: colors.text, fontSize: 11, textTransform: "capitalize" },
  barTrack: { flex: 1, height: 6, backgroundColor: colors.panel2, borderRadius: 99, overflow: "hidden" },
  barFill: { height: 6, backgroundColor: colors.purple, borderRadius: 99 },
  barScore: { width: 37, color: colors.muted, fontSize: 10, textAlign: "right" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  entityChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel2, padding: 9, borderRadius: 10, gap: 4 },
  entityText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  entityLabel: { color: colors.blue, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 },
  keywordChip: { backgroundColor: colors.pill, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  keywordText: { color: colors.accent, fontSize: 11, fontWeight: "600" },
  emptyText: { color: colors.muted, fontSize: 12 },
  warningText: { color: colors.orange, fontSize: 11, lineHeight: 17, marginBottom: 10 },
  cueRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  qualityCard: { gap: 8, padding: 12, backgroundColor: colors.panel2, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  qualityTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
  qualityPositive: { color: colors.accent },
  qualityEvidence: { gap: 6, paddingTop: 4 },
  qualityQuote: { color: colors.muted, fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  cueLabel: { color: colors.muted, fontSize: 12, textTransform: "capitalize" },
  cueCount: { color: colors.text, fontSize: 12, fontWeight: "800" },
  resultBody: { color: colors.text, fontSize: 13, lineHeight: 20 },
  jsonText: { color: colors.code, fontSize: 10, lineHeight: 15 },
  skeletonLine: { height: 9, borderRadius: 6 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", textTransform: "capitalize", minWidth: 90, maxWidth: 125 },
  detailValue: { color: colors.text, fontSize: 12, lineHeight: 18, flex: 1, textAlign: "right" },
  languageHero: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, backgroundColor: colors.panel2 },
  languageCode: { color: colors.text, fontSize: 23, fontWeight: "800", marginTop: 3 },
  tokenTable: { minWidth: 680, borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: "hidden" },
  tokenRow: { flexDirection: "row", alignItems: "center", minHeight: 38, borderBottomWidth: 1, borderBottomColor: colors.border },
  tokenHeader: { backgroundColor: colors.panel2 },
  tokenCell: { width: 112, paddingHorizontal: 10, paddingVertical: 9, color: colors.text, fontSize: 11 },
  tokenHeaderText: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  syntaxCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 9 },
  syntaxRoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.panel2, borderRadius: 8, padding: 10 },
  syntaxRootValue: { color: colors.accent, fontSize: 14, fontWeight: "800" },
  syntaxChildren: { color: colors.muted, fontSize: 10, flex: 1, textAlign: "right" },
  keywordResultRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  keywordRank: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.panel2, alignItems: "center", justifyContent: "center" },
  keywordRankText: { color: colors.accent, fontSize: 10, fontWeight: "800" },
  disclaimer: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: "center", paddingHorizontal: 10 },
  singleInput: { color: colors.text, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, fontSize: 13, marginTop: 4 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 10 },
  bigScore: { color: colors.accent, fontSize: 48, fontWeight: "800", marginBottom: 8 },
  bigScoreSmall: { color: colors.accent, fontSize: 30, fontWeight: "800" },
  scoreHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  footer: { alignItems: "center", gap: 6, paddingTop: 8 },
  footerLine: { height: 1, backgroundColor: colors.border, width: "100%", marginBottom: 8 },
  footerTitle: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 2 },
  footerText: { color: colors.muted, fontSize: 10, textAlign: "center" },
});
