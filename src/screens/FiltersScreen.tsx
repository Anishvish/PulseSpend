import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

import { FilterChip } from "@/components/FilterChip";
import { GlassCard } from "@/components/GlassCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppTheme } from "@/theme/ThemeProvider";

export function FiltersScreen() {
  useBootstrap();
  const theme = useAppTheme();
  const { filters, availableCategories, availableApps, applyFilters } = useTransactionStore((state) => ({
    filters: state.filters,
    availableCategories: state.availableCategories,
    availableApps: state.availableApps,
    applyFilters: state.applyFilters,
  }));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const toggleListValue = (key: "category" | "app_source", value: string) => {
    const current = filters[key] ?? [];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    applyFilters({ [key]: next } as never);
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Filters" subtitle="Layer date, app, amount, and merchant filters instantly." />

      <GlassCard style={styles.card}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Date range</Text>
        <View style={styles.row}>
          <Pressable style={[styles.inputButton, { borderColor: theme.colors.border }]} onPress={() => setShowStartPicker(true)}>
            <Text style={[styles.inputText, { color: theme.colors.text }]}>
              {filters.startDate ? dayjs(filters.startDate).format("DD MMM YYYY") : "Start date"}
            </Text>
          </Pressable>
          <Pressable style={[styles.inputButton, { borderColor: theme.colors.border }]} onPress={() => setShowEndPicker(true)}>
            <Text style={[styles.inputText, { color: theme.colors.text }]}>
              {filters.endDate ? dayjs(filters.endDate).format("DD MMM YYYY") : "End date"}
            </Text>
          </Pressable>
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Merchant search</Text>
        <TextInput
          placeholder="Search merchant"
          placeholderTextColor={theme.colors.textSoft}
          value={filters.search ?? ""}
          onChangeText={(text) => applyFilters({ search: text })}
          style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Categories</Text>
        <View style={styles.wrap}>
          {availableCategories.length ? (
            availableCategories.map((category) => (
              <FilterChip
                key={category}
                label={category}
                active={Boolean(filters.category?.includes(category))}
                onPress={() => toggleListValue("category", category)}
              />
            ))
          ) : (
            <Text style={[styles.empty, { color: theme.colors.textSoft }]}>Categories appear once transactions are imported.</Text>
          )}
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>App sources</Text>
        <View style={styles.wrap}>
          {availableApps.length ? (
            availableApps.map((app) => (
              <FilterChip
                key={app}
                label={app}
                active={Boolean(filters.app_source?.includes(app))}
                onPress={() => toggleListValue("app_source", app)}
              />
            ))
          ) : (
            <Text style={[styles.empty, { color: theme.colors.textSoft }]}>App sources appear once transactions are imported.</Text>
          )}
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Amount range</Text>
        <View style={styles.row}>
          <TextInput
            keyboardType="numeric"
            placeholder="Min"
            placeholderTextColor={theme.colors.textSoft}
            value={filters.minAmount?.toString() ?? ""}
            onChangeText={(text) => applyFilters({ minAmount: text ? Number(text) : null })}
            style={[styles.textInput, styles.half, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
          <TextInput
            keyboardType="numeric"
            placeholder="Max"
            placeholderTextColor={theme.colors.textSoft}
            value={filters.maxAmount?.toString() ?? ""}
            onChangeText={(text) => applyFilters({ maxAmount: text ? Number(text) : null })}
            style={[styles.textInput, styles.half, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
        </View>
      </GlassCard>

      {showStartPicker ? (
        <DateTimePicker
          value={filters.startDate ? new Date(filters.startDate) : new Date()}
          mode="date"
          onChange={(_, value) => {
            setShowStartPicker(false);
            if (value) {
              applyFilters({ startDate: dayjs(value).startOf("day").toISOString() });
            }
          }}
        />
      ) : null}

      {showEndPicker ? (
        <DateTimePicker
          value={filters.endDate ? new Date(filters.endDate) : new Date()}
          mode="date"
          onChange={(_, value) => {
            setShowEndPicker(false);
            if (value) {
              applyFilters({ endDate: dayjs(value).endOf("day").toISOString() });
            }
          }}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inputButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  inputText: {
    fontSize: 15,
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  half: {
    flex: 1,
  },
  empty: {
    fontSize: 14,
  },
});
