import { getProduct, type VariantId } from "@/src/config/commerce";
import {
  normalizeJerseyName,
  personalization,
} from "@/src/config/personalization";
import letteringMetrics from "./jersey-lettering-metrics.json";
import styles from "./JerseyPreview.module.css";

export type JerseyPreviewProps = {
  variantId: VariantId;
  name: string;
  view: "front" | "back";
  className?: string;
  priority?: boolean;
};

/** Normalized artwork coordinates; physical print dimensions belong to the supplier template. */
export const jerseyPreviewPrintSpec = {
  artworkWidth: 1254,
  artworkHeight: 1254,
  centerX: 638,
  centerY: 288,
  maximumNameWidth: 440,
  maximumCapHeight: 62,
  minimumFontSize: 32,
  extension: 1.45,
} as const;

export function JerseyPreview({
  variantId,
  name,
  view,
  className = "",
  priority = false,
}: JerseyPreviewProps) {
  const product = getProduct(variantId)!;
  const normalized = normalizeJerseyName(name).slice(
    0,
    personalization.maxLength,
  );
  const printedName = normalized || "YOUR NAME";
  const label = `${product.name}, ${view} view${view === "back" ? `, printed name ${printedName}` : ""}`;
  const classes =
    `${styles.preview} personalized-jersey-preview ${className}`.trim();

  if (view === "front")
    return (
      <img
        className={classes}
        src={product.front}
        alt={label}
        width={1254}
        height={1254}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        draggable={false}
        data-view="front"
        data-variant={variantId}
      />
    );

  const advances = letteringMetrics.advances as Record<string, number>;
  const emWidth = Array.from(printedName).reduce(
    (width, character) => width + (advances[character] ?? 0.7),
    0,
  );
  const maximumFontSize =
    jerseyPreviewPrintSpec.maximumCapHeight / letteringMetrics.capHeight;
  const fontSize = Math.max(
    jerseyPreviewPrintSpec.minimumFontSize,
    Math.min(
      maximumFontSize,
      jerseyPreviewPrintSpec.maximumNameWidth /
        (emWidth * jerseyPreviewPrintSpec.extension),
    ),
  );
  const textWidth = Math.min(
    jerseyPreviewPrintSpec.maximumNameWidth,
    emWidth * fontSize * jerseyPreviewPrintSpec.extension,
  );
  const baseline =
    jerseyPreviewPrintSpec.centerY +
    (fontSize * letteringMetrics.capHeight) / 2;

  return (
    <svg
      className={classes}
      viewBox="0 0 1254 1254"
      width={1254}
      height={1254}
      role="img"
      aria-label={label}
      data-view="back"
      data-variant={variantId}
      data-printed-name={normalized}
      data-preview-name={printedName}
    >
      <title>{label}</title>
      <image
        href={`/assets/evoke/jersey-${variantId}-back-blank.webp`}
        width="1254"
        height="1254"
        preserveAspectRatio="xMidYMid meet"
      />
      <text
        className={styles.lettering}
        x={jerseyPreviewPrintSpec.centerX}
        y={baseline}
        fontSize={fontSize}
        textAnchor="middle"
        textLength={textWidth}
        lengthAdjust="spacingAndGlyphs"
        fill={variantId === "black" ? "#efeff2" : "#242427"}
        stroke={variantId === "black" ? "#a6a6ad" : "#424248"}
        strokeWidth={0.65}
        letterSpacing={0}
      >
        {printedName}
      </text>
    </svg>
  );
}

export default JerseyPreview;
