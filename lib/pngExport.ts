import { Rickshaw } from './types';
import { naturalCompare } from './utils';

export function exportBaqayaPng(allRickshaws: Rickshaw[], activeTab: 'all' | 'rickshaw' | 'redi') {
  const sorted = allRickshaws
    .filter((s) => activeTab === 'all' || s.type === activeTab)
    .slice()
    .sort((a, b) => naturalCompare(a.numberId, b.numberId));

  const zeroRows = sorted.filter((s) => s.absent === 0);
  const dueRows = sorted.filter((s) => s.absent > 0);

  const scale = 2;
  const width = 480;
  const rowHeight = 38;
  const barHeight = 52;
  const tableHeaderHeight = 40;
  const footerHeight = 44;
  const sectionGap = 22;
  const topMargin = 16;
  const bottomMargin = 16;

  function sectionHeight(rowsCount: number) {
    return barHeight + tableHeaderHeight + Math.max(rowsCount, 1) * rowHeight + footerHeight;
  }

  const h1 = sectionHeight(zeroRows.length);
  const h2 = sectionHeight(dueRows.length);
  const height = topMargin + h1 + sectionGap + h2 + bottomMargin;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  function drawSection(
    startY: number,
    title: string,
    rows: Rickshaw[],
    barColor: string,
    lightBg: string,
    textColor: string
  ) {
    let y = startY;

    ctx!.fillStyle = barColor;
    ctx!.fillRect(0, y, width, barHeight);
    ctx!.fillStyle = '#ffffff';
    ctx!.font = '700 19px Arial';
    ctx!.textAlign = 'center';
    ctx!.fillText(title, width / 2, y + barHeight / 2 + 7);
    ctx!.textAlign = 'left';
    y += barHeight;

    ctx!.fillStyle = lightBg;
    ctx!.fillRect(0, y, width, tableHeaderHeight);
    ctx!.fillStyle = '#333';
    ctx!.font = '700 14px Arial';
    ctx!.fillText('Rickshaw', 20, y + 26);
    ctx!.textAlign = 'right';
    ctx!.fillText('Baqaya Din', width - 20, y + 26);
    ctx!.textAlign = 'left';
    y += tableHeaderHeight;

    let total = 0;
    if (rows.length === 0) {
      ctx!.fillStyle = '#aaa';
      ctx!.font = '400 14px Arial';
      ctx!.fillText('Koi rickshaw nahi hai.', 20, y + 24);
      y += rowHeight;
    } else {
      rows.forEach((s, i) => {
        total += s.absent;
        if (i % 2 === 1) {
          ctx!.fillStyle = '#fafafa';
          ctx!.fillRect(0, y, width, rowHeight);
        }
        ctx!.fillStyle = '#222';
        ctx!.font = '700 15px Arial';
        ctx!.fillText(s.numberId, 20, y + 25);

        ctx!.fillStyle = textColor;
        ctx!.font = '700 15px Arial';
        ctx!.textAlign = 'right';
        ctx!.fillText(String(s.absent), width - 20, y + 25);
        ctx!.textAlign = 'left';

        ctx!.strokeStyle = '#eeeeee';
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(0, y + rowHeight);
        ctx!.lineTo(width, y + rowHeight);
        ctx!.stroke();

        y += rowHeight;
      });
    }

    ctx!.fillStyle = lightBg;
    ctx!.fillRect(0, y, width, footerHeight);
    ctx!.fillStyle = '#333';
    ctx!.font = '700 14px Arial';
    ctx!.fillText('Total: ' + rows.length + ' rickshaw', 20, y + 27);
    ctx!.textAlign = 'right';
    ctx!.fillText(total + ' din', width - 20, y + 27);
    ctx!.textAlign = 'left';
    y += footerHeight;

    return y;
  }

  let y = topMargin;
  y = drawSection(y, '0 Din Waale Rickshaw', zeroRows, '#1e7e34', '#eaf7ee', '#2e7d32');
  y += sectionGap;
  drawSection(y, 'Baqaya Din Waale Rickshaw', dueRows, '#c0392b', '#fdecea', '#c0392b');

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `meri-parking-baqaya-${today}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
