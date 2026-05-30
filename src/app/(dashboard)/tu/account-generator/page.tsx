"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Users, ShieldAlert, Loader2, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { toast } from "react-hot-toast";

interface ParsedAccount {
  full_name: string;
  role: string;
  email: string;
  password: string;
  class_id?: string;
  status?: "pending" | "success" | "error";
  error_msg?: string;
}

export default function AccountGenerator() {
  const [accounts, setAccounts] = useState<ParsedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateEmail = (name: string, role: string) => {
    const parts = name.trim().split(" ");
    let initials = parts[0].substring(0, Math.min(3, parts[0].length)).toLowerCase();
    
    if (role === "teacher") {
      initials = parts[0].substring(0, Math.min(4, parts[0].length)).toLowerCase();
      return `${initials}-teacher@mmis.msi`;
    }
    
    return `${initials}${Math.floor(Math.random() * 1000)}@mmis.msi`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const parsed = data.map((row: any) => {
          const name = row["Full Name"] || row["Name"] || row["Nama Lengkap"];
          const role = (row["Role"] || row["Peran"] || "student").toLowerCase();
          
          if (!name) return null;
          
          return {
            full_name: name,
            role,
            email: generateEmail(name, role),
            password: `NIA-${Math.floor(Math.random() * 90000) + 10000}`,
            status: "pending" as const
          };
        }).filter(Boolean) as ParsedAccount[];

        setAccounts(parsed);
      } catch (err) {
        toast.error("Failed to parse Excel file. Ensure columns 'Full Name' and 'Role' exist.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const submitAccounts = async () => {
    if (accounts.length === 0) return;
    setGenerating(true);

    try {
      const response = await fetch("/api/admin/create-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: accounts })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create accounts");

      toast.success(`Successfully generated ${data.created} accounts!`);
      
      // Update UI Status
      const errorMap = new Map<string, string>(data.errors?.map((e: any) => [e.email, e.error]));
      setAccounts(prev => prev.map(acc => ({
        ...acc,
        status: errorMap.has(acc.email) ? "error" : "success",
        error_msg: errorMap.get(acc.email)
      })));

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bulk Account Generator</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Import Excel data to instantly mint Academy accounts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 border-dashed border-2 bg-[var(--bg-secondary)] flex flex-col items-center justify-center p-8 text-center">
           <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-4">
              <FileSpreadsheet className="h-8 w-8" />
           </div>
           <h3 className="font-bold text-[var(--text-primary)] mb-2">Upload Excel Data</h3>
           <p className="text-xs text-[var(--text-secondary)] mb-6">File must contain <strong className="text-[var(--text-primary)]">Full Name</strong> and <strong className="text-[var(--text-primary)]">Role</strong> columns.</p>
           
           <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent)]/90 transition-all shadow-lg shadow-[var(--accent)]/20">
              <Upload className="h-4 w-4" />
              {loading ? "Parsing..." : "Select File"}
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} disabled={loading || generating} />
           </label>
        </Card>

        <Card className="col-span-1 md:col-span-2 overflow-hidden flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--text-primary)]">Parsed Roster ({accounts.length})</h3>
              {accounts.length > 0 && (
                <Button onClick={submitAccounts} loading={generating} disabled={accounts.some(a => a.status === 'success')} icon={<Users className="h-4 w-4" />}>
                   Generate Accounts
                </Button>
              )}
           </div>

           <div className="flex-1 overflow-y-auto max-h-[400px] border border-[var(--border)] rounded-xl">
              <table className="w-full text-left text-sm">
                 <thead className="bg-[var(--bg-secondary)] sticky top-0">
                    <tr className="text-[10px] text-[var(--text-tertiary)] uppercase font-black tracking-widest">
                       <th className="px-4 py-3">Full Name</th>
                       <th className="px-4 py-3">Role</th>
                       <th className="px-4 py-3">Auto-Email</th>
                       <th className="px-4 py-3">Temp Pass</th>
                       <th className="px-4 py-3">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--border)]">
                    {accounts.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="py-12 text-center text-[var(--text-tertiary)]">
                             No data loaded. Upload an Excel file to begin.
                          </td>
                       </tr>
                    ) : (
                       accounts.map((acc, i) => (
                          <tr key={i} className="hover:bg-[var(--bg-secondary)]/50">
                             <td className="px-4 py-3 font-medium">{acc.full_name}</td>
                             <td className="px-4 py-3 capitalize">{acc.role}</td>
                             <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">{acc.email}</td>
                             <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">{acc.password}</td>
                             <td className="px-4 py-3">
                                {acc.status === 'success' ? <Badge variant="success">Minted</Badge> : 
                                 acc.status === 'error' ? <span title={acc.error_msg}><Badge variant="error">Failed</Badge></span> : 
                                 <Badge variant="default">Ready</Badge>}
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
           
           <div className="mt-4 p-3 rounded-xl bg-orange-50 border border-orange-100 flex gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0" />
              <p className="text-xs text-orange-700">
                 <strong>Security Notice:</strong> All newly generated accounts are strictly injected with a <code>force_password_change</code> flag. Users will be hard-locked out of the LMS portal until they successfully reset their temporary password.
              </p>
           </div>
        </Card>
      </div>
    </div>
  );
}
