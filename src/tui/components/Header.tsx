import { basename } from "node:path";
import { Box, Text } from "ink";
import type { Model } from "../../types";
import { VERSION } from "../../version";
import { symbols, t } from "../theme";

interface HeaderProps {
  model: Model | null;
  modelCount: number;
}

export function Header({ model, modelCount }: HeaderProps) {
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Box>
          <Text bold color={t().fg.accent}>
            🏄 paikea
          </Text>
          <Text color={t().fg.dim}> {VERSION}</Text>
          <Text color={t().fg.dim}> {symbols.divider} </Text>
          <Text color={t().fg.primary}>
            {symbols.gear} {model?.name ?? "none"}
          </Text>
          {modelCount > 1 && (
            <Text color={t().fg.dim}> ({modelCount} models)</Text>
          )}
        </Box>
        <Text color={t().fg.dim}>{basename(process.cwd())}</Text>
      </Box>
      {/* horizon line — the sea/sky boundary under the masthead */}
      <Box
        borderStyle="single"
        borderColor={t().fg.dim}
        borderTop={false}
        borderLeft={false}
        borderRight={false}
      />
    </Box>
  );
}
