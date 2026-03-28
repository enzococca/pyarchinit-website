"use client";

import { useState, useEffect } from "react";
import { BarChart3, Eye, Globe, MapPin, ExternalLink, Clock } from "lucide-react";

interface DayCount {
  date: string;
  count: number;
}

interface PathCount {
  path: string;
  count: number;
}

interface ReferrerCount {
  referrer: string;
  count: number;
}

interface CountryCount {
  country: string;
  count: number;
}

interface PageViewRecord {
  id: string;
  path: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
}

interface AnalyticsData {
  today: number;
  last7days: DayCount[];
  topPages: PathCount[];
  topReferrers: ReferrerCount[];
  topCountries: CountryCount[];
  recent: PageViewRecord[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sand/40">
        <BarChart3 size={32} className="animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-sand/40">
        <p>Impossibile caricare i dati analytics.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.last7days.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={24} className="text-teal" />
        <h1 className="text-2xl font-mono text-teal">Analytics</h1>
      </div>

      {/* Today stat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-code-bg rounded-card border border-ochre/10 p-4">
          <p className="text-xs text-sand/50 mb-1">Visite oggi</p>
          <p className="text-3xl font-mono text-teal">{data.today}</p>
        </div>
        <div className="bg-code-bg rounded-card border border-ochre/10 p-4">
          <p className="text-xs text-sand/50 mb-1">Ultimi 7 giorni</p>
          <p className="text-3xl font-mono text-teal">
            {data.last7days.reduce((s, d) => s + d.count, 0)}
          </p>
        </div>
        <div className="bg-code-bg rounded-card border border-ochre/10 p-4">
          <p className="text-xs text-sand/50 mb-1">Pagine uniche (7gg)</p>
          <p className="text-3xl font-mono text-teal">{data.topPages.length}</p>
        </div>
        <div className="bg-code-bg rounded-card border border-ochre/10 p-4">
          <p className="text-xs text-sand/50 mb-1">Paesi (7gg)</p>
          <p className="text-3xl font-mono text-teal">{data.topCountries.length}</p>
        </div>
      </div>

      {/* Last 7 days bar chart */}
      <div className="bg-code-bg rounded-card border border-ochre/10 p-5 mb-8">
        <h2 className="text-sm font-mono text-sand/70 mb-4 flex items-center gap-2">
          <Eye size={14} className="text-teal" />
          Visite ultimi 7 giorni
        </h2>
        <div className="flex items-end gap-2 h-32">
          {data.last7days.map((d) => {
            const height = maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0;
            const label = new Date(d.date + "T00:00:00").toLocaleDateString("it-IT", {
              weekday: "short",
              day: "numeric",
            });
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-teal font-mono">{d.count > 0 ? d.count : ""}</span>
                <div className="w-full flex items-end" style={{ height: "80px" }}>
                  <div
                    className="w-full bg-teal/30 hover:bg-teal/50 transition rounded-t"
                    style={{ height: `${height}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-xs text-sand/40 text-center leading-tight">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: top pages + top referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top pages */}
        <div className="bg-code-bg rounded-card border border-ochre/10 p-5">
          <h2 className="text-sm font-mono text-sand/70 mb-4 flex items-center gap-2">
            <ExternalLink size={14} className="text-teal" />
            Pagine piu visitate (7gg)
          </h2>
          {data.topPages.length === 0 ? (
            <p className="text-xs text-sand/30">Nessun dato disponibile.</p>
          ) : (
            <div className="space-y-2">
              {data.topPages.map(({ path, count }) => {
                const pct = Math.round((count / (data.topPages[0]?.count ?? 1)) * 100);
                return (
                  <div key={path}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs text-sand font-mono truncate max-w-[70%]">{path}</span>
                      <span className="text-xs text-sand/50">{count}</span>
                    </div>
                    <div className="h-1 bg-sand/10 rounded-full overflow-hidden">
                      <div className="h-full bg-teal/50 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top referrers */}
        <div className="bg-code-bg rounded-card border border-ochre/10 p-5">
          <h2 className="text-sm font-mono text-sand/70 mb-4 flex items-center gap-2">
            <Globe size={14} className="text-teal" />
            Principali sorgenti (7gg)
          </h2>
          {data.topReferrers.length === 0 ? (
            <p className="text-xs text-sand/30">Nessun dato disponibile.</p>
          ) : (
            <div className="space-y-2">
              {data.topReferrers.map(({ referrer, count }) => {
                const pct = Math.round((count / (data.topReferrers[0]?.count ?? 1)) * 100);
                return (
                  <div key={referrer}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs text-sand font-mono truncate max-w-[70%]">{referrer}</span>
                      <span className="text-xs text-sand/50">{count}</span>
                    </div>
                    <div className="h-1 bg-sand/10 rounded-full overflow-hidden">
                      <div className="h-full bg-ochre/50 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top countries */}
      {data.topCountries.length > 0 && (
        <div className="bg-code-bg rounded-card border border-ochre/10 p-5 mb-8">
          <h2 className="text-sm font-mono text-sand/70 mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-teal" />
            Paesi (7gg)
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.topCountries.map(({ country, count }) => (
              <span
                key={country}
                className="text-xs bg-sand/5 border border-sand/10 rounded-full px-3 py-1 text-sand/70"
              >
                {country} <span className="text-teal font-mono">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent views */}
      <div className="bg-code-bg rounded-card border border-ochre/10 p-5">
        <h2 className="text-sm font-mono text-sand/70 mb-4 flex items-center gap-2">
          <Clock size={14} className="text-teal" />
          Ultime 20 visite
        </h2>
        {data.recent.length === 0 ? (
          <p className="text-xs text-sand/30">Nessun dato disponibile.</p>
        ) : (
          <div className="space-y-1.5">
            {data.recent.map((view) => (
              <div
                key={view.id}
                className="flex items-center gap-3 text-xs py-1.5 border-b border-sand/5 last:border-0"
              >
                <span className="text-sand/30 shrink-0 w-32 text-right">
                  {new Date(view.createdAt).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}{" "}
                  {new Date(view.createdAt).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="text-teal font-mono truncate flex-1">{view.path}</span>
                {view.country && (
                  <span className="text-sand/40 shrink-0">{view.country}{view.city ? ` / ${view.city}` : ""}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
