import type { MembershipCardData } from "../types";

const width = 1080;
const height = 680;
const timeZone = "America/Toronto";

export function cardDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function cardExpiration(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(new Date(value));
}

function lines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const result: string[] = [];
  let line = "";
  const glyphs = [
    ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
  ].map((part) => part.segment);
  for (const glyph of glyphs) {
    if (line && ctx.measureText(line + glyph).width > maxWidth) {
      const space = line.lastIndexOf(" ");
      if (space > 0 && glyph !== " ") {
        result.push(line.slice(0, space));
        line = line.slice(space + 1) + glyph;
      } else {
        result.push(line.trim());
        line = glyph.trimStart();
      }
    } else line += glyph;
  }
  if (line.trim()) result.push(line.trim());
  return result;
}

function fittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxSize: number,
  maxLines: number,
) {
  let size = maxSize;
  let wrapped: string[];
  do {
    ctx.font = `600 ${size}px Arial, sans-serif`;
    wrapped = lines(ctx, text, maxWidth);
    if (wrapped.length <= maxLines) break;
    size -= 1;
  } while (size > 12);
  wrapped.forEach((line, index) =>
    ctx.fillText(line, x, y + index * size * 1.16),
  );
}

/** A self-contained, origin-clean canvas: no remote fonts or images to block saving. */
export function drawMembershipCard(
  canvas: HTMLCanvasElement,
  card: MembershipCardData,
) {
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "Your browser could not create the card image. Try another browser.",
    );
  ctx.scale(2, 2);
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#163d2c");
  background.addColorStop(1, "#305440");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#d7eea81a";
  ctx.lineWidth = 2;
  for (const radius of [170, 235, 300]) {
    ctx.beginPath();
    ctx.arc(1090, 420, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The brand mark uses paths so the PNG needs no icon font.
  ctx.save();
  ctx.translate(82, 80);
  ctx.strokeStyle = "#d7eea8";
  ctx.lineWidth = 5;
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 20);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = "#f5f8ed";
  ctx.font = "600 32px Arial, sans-serif";
  ctx.fillText("ClubOS", 120, 91);
  ctx.fillStyle = "#c6d6bb";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("MEMBERSHIP CARD", 266, 89);

  const expired = card.status === "expired";
  ctx.fillStyle = expired ? "#fbd4c6" : "#d7eea8";
  ctx.beginPath();
  ctx.roundRect(768, 57, 248, 46, 23);
  ctx.fill();
  ctx.fillStyle = expired ? "#7c2d1d" : "#23412e";
  ctx.font = "700 16px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(expired ? "EXPIRED" : "ACTIVE AT ISSUE", 892, 86);
  ctx.textAlign = "left";

  ctx.fillStyle = "#d7eea8";
  fittedText(ctx, card.clubName, 64, 157, 952, 26, 2);
  ctx.fillStyle = "#bfceb5";
  ctx.font = "15px Arial, sans-serif";
  ctx.fillText("ISSUED TO", 64, 238);
  ctx.fillStyle = "#f5f8ed";
  fittedText(ctx, card.memberName, 64, 298, 952, 54, 3);

  ctx.strokeStyle = "#c7d7b63b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, 462);
  ctx.lineTo(1016, 462);
  ctx.stroke();
  ctx.fillStyle = "#bfceb5";
  ctx.font = "15px Arial, sans-serif";
  ctx.fillText(expired ? "EXPIRED ON" : "VALID UNTIL", 64, 500);
  ctx.fillText("MEMBERSHIP ID", 640, 500);
  ctx.fillStyle = expired ? "#fbd4c6" : "#d7eea8";
  ctx.font = "600 36px Arial, sans-serif";
  ctx.fillText(cardDate(card.expiresAt), 64, 545);
  ctx.fillStyle = "#f5f8ed";
  ctx.font = "18px monospace";
  ctx.fillText(card.membershipId, 640, 539);
  ctx.fillStyle = "#cad7c0";
  ctx.font = "17px Arial, sans-serif";
  const expiryTime = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(new Date(card.expiresAt));
  ctx.fillText(`${expiryTime} · Eastern time`, 64, 575);
  ctx.fillText(
    `Valid from ${card.startsAt ? cardDate(card.startsAt) : "not recorded"}`,
    640,
    575,
  );
  ctx.fillStyle = "#c0d0b5";
  ctx.font = "15px Arial, sans-serif";
  ctx.fillText(
    "Static proof of membership · Save a new card after renewal",
    64,
    635,
  );
  ctx.textAlign = "right";
  ctx.fillText(`Issued ${cardDate(card.issuedAt)}`, 1016, 635);
}

export async function membershipCardPng(
  card: MembershipCardData,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  drawMembershipCard(canvas, card);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new Error("The card image could not be saved. Please try again."),
            ),
      "image/png",
    );
  });
}

export function membershipCardFilename(card: MembershipCardData) {
  const club =
    card.clubName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "club";
  return `clubos-${club}-${card.membershipId.slice(-8)}-${card.status}.png`;
}

export function downloadMembershipCard(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Firefox needs the URL to survive until its download has started.
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
