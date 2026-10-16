import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Activity, AudioLines, BrainCircuit, Check, ChevronRight, CircleAlert, FileText,
  Gauge, Languages, Search, Sparkles, Tags, TextSearch, WandSparkles,
} from "lucide-react-native";
import { Panel } from "@/components/Panel";
import { SectionTitle } from "@/components/SectionTitle";
import { analyzeText, compareTexts, healthCheck, searchCorpus, Operation } from "@/lib/api";
import { colors } from "@/theme/colors";

const TOOLS: { id: Operation; title: string; desc: string; icon: any; tint: string }[] = [
  { id: "language", title: "Language ID", desc: "Detect language and alternatives", icon: Languages, tint: colors.orange },
  { id: "stats", title: "Text metrics", desc: "Readability, vocabulary, sentence stats", icon: Gauge, tint: colors.accent },
  { id: "sentiment", title: "Sentiment", desc: "Positive or negative tone", icon: Activity, tint: colors.blue },
  { id: "emotion", title: "Emotion map", desc: "Rank emotional signals", icon: AudioLines, tint: colors.purple },
  { id: "entities", title: "Named entities", desc: "People, places, dates, organisations", icon: Tags, tint: colors.orange },
  { id: "keywords", title: "Keywords", desc: "Important terms and phrases", icon: TextSearch, tint: colors.accent },
  { id: "pos", title: "Token & POS", desc: "Lemmas, grammar and dependencies", icon: Languages, tint: colors.blue },
  { id: "summary", title: "Summarize", desc: "Compress long passages", icon: FileText, tint: colors.purple },
  { id: "zero_shot", title: "Custom labels", desc: "Classify against your own labels", icon: WandSparkles, tint: colors.orange },
  { id: "excuse", title: "Excuse cues", desc: "Hedging, explanations and commitments", icon: BrainCircuit, tint: colors.red },
  { id: "syntax", title: "Syntax explorer", desc: "Sentence roots and dependency tree", icon: Sparkles, tint: colors.blue },
];

const DEMO = "I was going to submit the assignment yesterday, but my laptop stopped working right before the deadline. I contacted my teammate and promised to send the file this evening.";

function pretty(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

export default function HomeScreen() {
  const [text, setText] = useState(DEMO);
  const [selected, setSelected] = useState<Operation[]>(["stats", "sentiment", "emotion", "entities", "keywords", "excuse"]);
  const [labels, setLabels] = useState("excuse, apology, promise, complaint, joke");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(false);
  const [tab, setTab] = useState<"analyze" | "compare" | "corpus">("analyze");
  const [textB, setTextB] = useState("I couldn't finish it because my computer crashed.");
  const [secondary, setSecondary] = useState<any>(null);
  const [corpusQuery, setCorpusQuery] = useState("student excuses and missed deadlines");
  const [corpusResult, setCorpusResult] = useState<any>(null);
  const [toolSearch, setToolSearch] = useState("");

  useEffect(() => {
    healthCheck().then(setOnline).catch(() => setOnline(false));
  }, []);

  const chosenCount = selected.length;
  const filteredTools = TOOLS.filter((tool) =>
  `${tool.title} ${tool.desc} ${tool.id}`
    .toLowerCase()
    .includes(toolSearch.toLowerCase().trim())
  );
  const toggle = (id: Operation) => {
    setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const runAnalysis = async () => {
    if (!text.trim()) return Alert.alert("Text required", "Paste or type some text first.");
    if (!selected.length) return Alert.alert("Choose a tool", "Select at least one NLP operation.");
    setLoading(true);
    setResult(null);
    try {
      const labelList = labels.split(",").map((x) => x.trim()).filter(Boolean);
      const operations = selected.includes("zero_shot") ? selected : selected;
      setResult(await analyzeText(text, operations, labelList));
    } catch (error: any) {
      Alert.alert("Analysis failed", error.message || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  };

  const runCompare = async () => {
    if (!text.trim() || !textB.trim()) return Alert.alert("Both texts required", "Enter two passages.");
    setLoading(true);
    try {
      setSecondary(await compareTexts(text, textB));
    } catch (error: any) {
      Alert.alert("Comparison failed", error.message || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async () => {
    if (!corpusQuery.trim()) return;
    setLoading(true);
    try {
      setCorpusResult(await searchCorpus(corpusQuery));
    } catch (error: any) {
      Alert.alert("Search failed", error.message || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  };

  const resultCards = useMemo(() => result?.results ? Object.entries(result.results) : [], [result]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.topbar}>
          <View style={styles.brandMark}><Sparkles size={21} color={colors.bg} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>ExcuseMe<Text style={styles.dot}>.</Text></Text>
            <Text style={styles.eyebrow}>LINGUISTIC INTELLIGENCE LAB</Text>
          </View>
          <View style={[styles.status, { borderColor: online ? "#3A5330" : colors.border }]}>
            <View style={[styles.statusDot, { backgroundColor: online ? colors.green : colors.red }]} />
            <Text style={styles.statusText}>{online ? "API ONLINE" : "API OFFLINE"}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>TEXT, DECODED.</Text>
          <Text style={styles.headline}>Read between{"\n"}the <Text style={styles.headlineAccent}>lines.</Text></Text>
          <Text style={styles.subtitle}>A multi-tool NLP workbench for language, meaning, emotion and intent cues.</Text>
          <View style={styles.heroMeta}>
            <View style={styles.metaChip}><Text style={styles.metaChipText}>11 NLP TOOLS</Text></View>
            <View style={styles.metaChip}><Text style={styles.metaChipText}>TRANSFORMERS + LINGUISTICS</Text></View>
          </View>
        </View>

        <View style={styles.tabs}>
          {([
            ["analyze", "Analyze"],
            ["compare", "Compare"],
            ["corpus", "Corpus search"],
          ] as const).map(([key, title]) => (
            <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{title}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "analyze" ? (
          <>
            <Panel>
              <View style={styles.panelHeader}>
                <SectionTitle title="Input text" detail="Paste a message, excuse, paragraph or article." />
                <Pressable onPress={() => setText(DEMO)}><Text style={styles.actionText}>LOAD DEMO</Text></Pressable>
              </View>
              <TextInput
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
                placeholder="Paste text to analyze..."
                placeholderTextColor={colors.muted}
                style={styles.textArea}
              />
              <View style={styles.inputFooter}>
                <Text style={styles.counter}>{text.length.toLocaleString()} characters</Text>
                <Text style={styles.counter}>MAX 20K</Text>
              </View>
            </Panel>

            <View style={styles.sectionRow}>
              <SectionTitle
                title="Choose operations"
                detail={`${chosenCount} selected · ${filteredTools.length} tools shown`}
              />
              <Pressable onPress={() => setSelected(TOOLS.map((t) => t.id))}>
                <Text style={styles.actionText}>SELECT ALL</Text>
              </Pressable>
            </View>

            <TextInput
              value={toolSearch}
              onChangeText={setToolSearch}
              placeholder="Search NLP tools..."
              placeholderTextColor={colors.muted}
              style={styles.singleInput}
            />

            <View style={styles.toolGrid}>
              {filteredTools.map((tool) => {
                const active = selected.includes(tool.id);
                const Icon = tool.icon;
                return (
                  <Pressable key={tool.id} onPress={() => toggle(tool.id)} style={[styles.toolCard, active && styles.toolCardActive]}>
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

            {selected.includes("zero_shot") ? (
              <Panel>
                <SectionTitle title="Custom classification labels" detail="Separate labels with commas." />
                <TextInput value={labels} onChangeText={setLabels} style={styles.singleInput} placeholder="e.g. apology, excuse, promise" placeholderTextColor={colors.muted} />
              </Panel>
            ) : null}

            <Pressable onPress={runAnalysis} disabled={loading} style={[styles.primaryButton, loading && { opacity: 0.65 }]}>
              {loading ? <ActivityIndicator color={colors.bg} /> : <Sparkles size={18} color={colors.bg} />}
              <Text style={styles.primaryButtonText}>{loading ? "Processing text..." : "Run NLP analysis"}</Text>
              {!loading ? <ChevronRight size={18} color={colors.bg} /> : null}
            </Pressable>

            {result ? (
              <View style={styles.resultsWrap}>
                <SectionTitle title="Analysis results" detail="Predictions and linguistic measurements from the selected tools." />
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
                    ) : key === "entities" ? (
                      value.entities?.length ? <View style={styles.chipWrap}>{value.entities.map((e: any, i: number) => <View key={`${e.text}-${i}`} style={styles.entityChip}><Text style={styles.entityText}>{e.text}</Text><Text style={styles.entityLabel}>{e.label}</Text></View>)}</View> : <Text style={styles.emptyText}>No named entities detected.</Text>
                    ) : key === "keywords" ? (
                      <View style={styles.chipWrap}>{value.keywords?.map((k: any) => <View key={k.term} style={styles.keywordChip}><Text style={styles.keywordText}>{k.term}</Text></View>)}</View>
                    ) : key === "excuse" ? (
                      <>
                        <View style={styles.scoreHeader}>
                          <Text style={styles.bigScoreSmall}>{value.excuse_structure_score}/100</Text>
                          <Text style={styles.scorePill}>{value.score_label}</Text>
                        </View>
                        <Text style={styles.warningText}>{value.notice}</Text>
                        {Object.entries(value.cue_counts || {}).map(([cue, count]) => (
                          <View key={cue} style={styles.cueRow}><Text style={styles.cueLabel}>{cue.replaceAll("_", " ")}</Text><Text style={styles.cueCount}>{String(count)}</Text></View>
                        ))}
                      </>
                    ) : key === "summary" ? (
                      <Text style={styles.resultBody}>{value.summary}</Text>
                    ) : (
                      <Text selectable style={styles.jsonText}>{pretty(value)}</Text>
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
              <SectionTitle title="Semantic comparison" detail="Compare meaning with sentence embeddings." />
              <Text style={styles.fieldLabel}>TEXT A</Text>
              <TextInput value={text} onChangeText={setText} multiline textAlignVertical="top" style={styles.textArea} placeholderTextColor={colors.muted} />
              <Text style={styles.fieldLabel}>TEXT B</Text>
              <TextInput value={textB} onChangeText={setTextB} multiline textAlignVertical="top" style={styles.textArea} placeholderTextColor={colors.muted} />
              <Pressable onPress={runCompare} disabled={loading} style={styles.primaryButton}>
                {loading ? <ActivityIndicator color={colors.bg} /> : <Activity size={18} color={colors.bg} />}
                <Text style={styles.primaryButtonText}>Compare meaning</Text>
              </Pressable>
            </Panel>
            {secondary ? <Panel style={{ marginTop: 14 }}>
              <Text style={styles.resultTitle}>COSINE SIMILARITY</Text>
              <Text style={styles.bigScore}>{secondary.similarity}</Text>
              <Text style={styles.resultBody}>{secondary.interpretation}</Text>
            </Panel> : null}
          </>
        ) : null}

        {tab === "corpus" ? (
          <>
            <Panel>
              <SectionTitle title="Semantic corpus search" detail="Search passages indexed from the optional FineWeb sample." />
              <TextInput value={corpusQuery} onChangeText={setCorpusQuery} style={styles.singleInput} placeholder="Search the indexed corpus..." placeholderTextColor={colors.muted} />
              <Pressable onPress={runSearch} disabled={loading} style={styles.primaryButton}>
                {loading ? <ActivityIndicator color={colors.bg} /> : <Search size={18} color={colors.bg} />}
                <Text style={styles.primaryButtonText}>Search corpus</Text>
              </Pressable>
            </Panel>
            {corpusResult ? (
              <View style={{ gap: 10, marginTop: 14 }}>
                <SectionTitle title="Retrieved passages" detail={`${corpusResult.indexed_passages ?? 0} passages in local index`} />
                {corpusResult.message ? <Panel><Text style={styles.resultBody}>{corpusResult.message}</Text></Panel> : null}
                {(corpusResult.results || []).map((item: any) => (
                  <Panel key={item.id}>
                    <View style={styles.predictionRow}><Text style={styles.scorePill}>SIMILARITY {item.similarity}</Text><Text style={styles.counter}>ID {item.id}</Text></View>
                    <Text style={styles.resultBody}>{item.text}</Text>
                  </Panel>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerTitle}>EXCUSEME / NLP WORKBENCH</Text>
          <Text style={styles.footerText}>Built with FastAPI · spaCy · Transformers · Sentence Transformers · Expo</Text>
          <Text style={styles.footerText}>Language analysis, not a lie detector.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingBottom: 50, gap: 18, maxWidth: 900, width: "100%", alignSelf: "center" },
  topbar: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 8 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.7 },
  dot: { color: colors.accent },
  eyebrow: { color: colors.muted, fontSize: 9, letterSpacing: 1.8, marginTop: 2 },
  status: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 99 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  hero: { paddingTop: 22, paddingBottom: 8 },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 2.5, marginBottom: 9 },
  headline: { color: colors.text, fontSize: 43, lineHeight: 46, fontWeight: "800", letterSpacing: -1.8 },
  headlineAccent: { color: colors.accent },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, maxWidth: 520, marginTop: 12 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 16 },
  metaChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  metaChipText: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  tabs: { flexDirection: "row", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 4, borderRadius: 14 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: colors.panel2 },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: colors.text },
  panelHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  actionText: { color: colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.8, paddingTop: 4 },
  textArea: { minHeight: 140, color: colors.text, backgroundColor: "#0B0F16", borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, fontSize: 14, lineHeight: 21, marginTop: 4 },
  inputFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 9 },
  counter: { color: colors.muted, fontSize: 10 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  toolCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 11, width: "48.5%", minHeight: 78 },
  toolCardActive: { borderColor: "#526B3A", backgroundColor: "#111A11" },
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
  predictionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  predictionMain: { color: colors.text, fontSize: 20, fontWeight: "800" },
  scorePill: { color: colors.accent, fontSize: 10, fontWeight: "700", backgroundColor: "#1D2A18", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, overflow: "hidden" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 86, color: colors.text, fontSize: 11, textTransform: "capitalize" },
  barTrack: { flex: 1, height: 6, backgroundColor: colors.panel2, borderRadius: 99, overflow: "hidden" },
  barFill: { height: 6, backgroundColor: colors.purple, borderRadius: 99 },
  barScore: { width: 37, color: colors.muted, fontSize: 10, textAlign: "right" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  entityChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel2, padding: 9, borderRadius: 10, gap: 4 },
  entityText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  entityLabel: { color: colors.blue, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 },
  keywordChip: { backgroundColor: "#1D2A18", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  keywordText: { color: colors.accent, fontSize: 11, fontWeight: "600" },
  emptyText: { color: colors.muted, fontSize: 12 },
  warningText: { color: colors.orange, fontSize: 11, lineHeight: 17, marginBottom: 10 },
  cueRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  cueLabel: { color: colors.muted, fontSize: 12, textTransform: "capitalize" },
  cueCount: { color: colors.text, fontSize: 12, fontWeight: "800" },
  resultBody: { color: colors.text, fontSize: 13, lineHeight: 20 },
  jsonText: { color: "#C3D0E2", fontSize: 10, lineHeight: 15 },
  disclaimer: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: "center", paddingHorizontal: 10 },
  singleInput: { color: colors.text, backgroundColor: "#0B0F16", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, fontSize: 13, marginTop: 4 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 10 },
  bigScore: { color: colors.accent, fontSize: 48, fontWeight: "800", marginBottom: 8 },
  bigScoreSmall: { color: colors.accent, fontSize: 30, fontWeight: "800" },
  scoreHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  footer: { alignItems: "center", gap: 7, paddingTop: 12 },
  footerLine: { height: 1, backgroundColor: colors.border, width: "100%", marginBottom: 8 },
  footerTitle: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 2 },
  footerText: { color: colors.muted, fontSize: 10, textAlign: "center" },
});
