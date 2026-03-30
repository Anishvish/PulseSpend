import dayjs from "dayjs";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";
import { DailyTrendPoint } from "@/types";

type Props = {
  points: DailyTrendPoint[];
};

export function HeatmapGrid({ points }: Props) {
  const theme = useAppTheme();
  const map = new Map(points.map((item) => [item.day, Number(item.total)]));
  const days = Array.from({ length: 28 }, (_, index) => dayjs().subtract(27 - index, "day").format("YYYY-MM-DD"));

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {days.map((day) => {
          const amount = map.get(day) ?? 0;
          const intensity = Math.min(amount / 3000, 1);
          return (
            <View key={day} style={styles.cellWrap}>
              <View
                style={[
                  styles.cell,
                  {
                    backgroundColor: amount
                      ? `rgba(93, 224, 230, ${0.18 + intensity * 0.72})`
                      : "rgba(255,255,255,0.05)",
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <Text style={[styles.caption, { color: theme.colors.textSoft }]}>Last 4 weeks spending heatmap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cellWrap: {
    width: "14.28%",
    padding: 4,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
  },
  caption: {
    fontSize: 12,
  },
});
