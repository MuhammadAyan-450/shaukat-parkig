import { Rickshaw, RickshawType } from './types';
import { naturalCompare, unitLabelPlural } from './utils';

export function exportBaqayaPng(allRickshaws: Rickshaw[], activeTab: 'all' | RickshawType) {
  const sorted = allRickshaws
    .filter((s) => activeTab === 'all' || s.type === activeTab)
    .slice()
    .sort((a, b) => naturalCompare(a.numberId, b.numberId));

  // Agar ek hi type select hai (jaise sirf Bike) to uska sahi unit (din/mahine)
  // dikhayen, warna "All" mein generic "Baqaya" rakhte hain.
  const unitWord = activeTab === 'all' ? '' : ' ' + unitLabelPlural(activeTab as RickshawType);
  const colHeader = 'Baqaya' + unitWord;
  const totalUnitWord = activeTab === 'all' ? 'din/mahine' : unitLabelPlural(activeTab as RickshawType);

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
  const dateHeaderHeight = 30;
  const bottomMargin = 16;

  const now = new Date();
  const dateTimeLabel =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  function sectionHeight(rowsCount: number) {
    return barHeight + tableHeaderHeight + Math.max(rowsCount, 1) * rowHeight + footerHeight;
  }

  const h1 = sectionHeight(zeroRows.length);
  const h2 = sectionHeight(dueRows.length);
  const height = topMargin + dateHeaderHeight + h1 + sectionGap + h2 + bottomMargin;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Date/time header — kab yeh PNG banayi gayi
  ctx.fillStyle = '#888';
  ctx.font = '600 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Banayi Gayi: ' + dateTimeLabel, width / 2, topMargin + 16);
  ctx.textAlign = 'left';

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
    ctx!.fillText(colHeader, width - 20, y + 26);
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

        const credit = s.credit || 0;
        ctx!.fillStyle = credit > 0 ? '#1d5fd6' : credit < 0 ? '#c0392b' : textColor;
        ctx!.font = '700 15px Arial';
        ctx!.textAlign = 'right';
        const label = credit !== 0 ? (credit > 0 ? '+Rs' + credit : '-Rs' + Math.abs(credit)) : String(s.absent);
        ctx!.fillText(label, width - 20, y + 25);
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
    ctx!.fillText(total + ' ' + totalUnitWord, width - 20, y + 27);
    ctx!.textAlign = 'left';
    y += footerHeight;

    return y;
  }

  let y = topMargin + dateHeaderHeight;
  const zeroTitle = activeTab === 'all' ? '0 Baqaya Waale' : `0 ${unitLabelPlural(activeTab as RickshawType)} Waale`;
  const dueTitle = activeTab === 'all' ? 'Baqaya Waale' : `Baqaya ${unitLabelPlural(activeTab as RickshawType)} Waale`;
  y = drawSection(y, zeroTitle, zeroRows, '#1e7e34', '#eaf7ee', '#2e7d32');
  y += sectionGap;
  drawSection(y, dueTitle, dueRows, '#c0392b', '#fdecea', '#c0392b');

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    a.href = url;
    a.download = `meri-parking-baqaya-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}