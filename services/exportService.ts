import type { Trade, LogEntry } from '../types';

function convertToCSV(data: any[], headers: { key: string, label: string }[]): string {
    const headerRow = headers.map(h => h.label).join(',');
    const rows = data.map(row => {
        return headers.map(header => {
            let cell = row[header.key] === undefined || row[header.key] === null ? '' : String(row[header.key]);
            cell = cell.replace(/"/g, '""');
            if (cell.includes(',')) {
                cell = `"${cell}"`;
            }
            return cell;
        }).join(',');
    });
    return [headerRow, ...rows].join('\n');
}

export const exportTradesToCSV = (trades: any[], sessionName: string) => {
    if (!trades || trades.length === 0) {
        console.warn("No trades to export.");
        return;
    }

    const headers = [
        { key: 'id', label: 'ID Trade' },
        { key: 'sessionId', label: 'ID Session' },
        { key: 'pair', label: 'Paire' },
        { key: 'strategyName', label: 'Stratégie' },
        { key: 'timeframe', label: 'Timeframe' },
        { key: 'direction', label: 'Direction' },
        { key: 'entryTime', label: 'Date entrée' },
        { key: 'entryPrice', label: 'Prix entrée' },
        { key: 'exitTime', label: 'Date sortie' },
        { key: 'exitPrice', label: 'Prix de sortie' },
        { key: 'exitReason', label: 'Motif' },
        { key: 'positionSize', label: 'Taille (Quote)' },
        { key: 'pnlAmount', label: 'P&L ($)' },
        { key: 'pnl', label: 'P&L (%)' },
        { key: 'plannedRR', label: 'R:R Planifié' },
        { key: 'realizedRR', label: 'R:R Réalisé' },
        { key: 'duration', label: 'Durée' },
    ];
    
    const formattedTrades = trades.map(t => ({
        ...t,
        entryTime: new Date(t.time).toISOString(),
        exitTime: t.exitTime ? new Date(t.exitTime).toISOString() : '',
        entryPrice: t.entryPrice.toFixed(4),
        exitPrice: t.exitPrice ? t.exitPrice.toFixed(4) : '',
        positionSize: t.positionSize.toFixed(2),
        pnlAmount: t.pnlAmount ? t.pnlAmount.toFixed(2) : '0.00',
        pnl: t.pnl ? t.pnl.toFixed(2) : '0.00',
        plannedRR: t.plannedRR ? t.plannedRR.toFixed(2) : '',
        realizedRR: t.realizedRR ? t.realizedRR.toFixed(2) : '',
    }));

    const csvString = convertToCSV(formattedTrades, headers);
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const safeSessionName = sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `botmonster_journal_${safeSessionName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportLogsToTxt = (logs: LogEntry[], t: (key: string, variables?: Record<string, string | number>) => string) => {
    if (!logs || logs.length === 0) {
        alert("No logs to export for this session.");
        return;
    }

    const formattedLogs = logs
        .slice()
        .reverse()
        .map(log => {
            const timestamp = new Date(log.time).toISOString();
            const message = t(log.messageKey, log.messagePayload);
            return `${timestamp} [${log.type.toUpperCase()}] - ${message}`;
        })
        .join('\n');

    const blob = new Blob([formattedLogs], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `botmonster_logs_${date}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};