import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Mail, Target } from "lucide-react";

const Reports = () => {
  const [customerGrowth, setCustomerGrowth] = useState<any[]>([]);
  const [emailActivity, setEmailActivity] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);

    // Customer growth over last 6 months
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - 6);

    const { data: customers } = await supabase
      .from("customers")
      .select("created_at")
      .gte("created_at", monthsAgo.toISOString())
      .order("created_at", { ascending: true });

    // Group by month
    const growthByMonth: { [key: string]: number } = {};
    customers?.forEach((customer) => {
      const month = new Date(customer.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      growthByMonth[month] = (growthByMonth[month] || 0) + 1;
    });

    setCustomerGrowth(
      Object.entries(growthByMonth).map(([month, count]) => ({
        month,
        customers: count,
      }))
    );

    // Email activity by month
    const { data: emails } = await supabase
      .from("emails")
      .select("sent_at")
      .gte("sent_at", monthsAgo.toISOString())
      .order("sent_at", { ascending: true });

    const emailsByMonth: { [key: string]: number } = {};
    emails?.forEach((email) => {
      const month = new Date(email.sent_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      emailsByMonth[month] = (emailsByMonth[month] || 0) + 1;
    });

    setEmailActivity(
      Object.entries(emailsByMonth).map(([month, count]) => ({
        month,
        emails: count,
      }))
    );

    // Status distribution
    const { data: allCustomers } = await supabase
      .from("customers")
      .select("status");

    const statusCount: { [key: string]: number } = {};
    allCustomers?.forEach((customer) => {
      const status = customer.status || "Unknown";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    setStatusDistribution(
      Object.entries(statusCount).map(([status, count]) => ({ status, count }))
    );

    // Top customers by email communication
    const { data: emailCounts } = await supabase
      .from("emails")
      .select("customer_id, customers(name)");

    const customerEmailCount: {
      [key: string]: { name: string; count: number };
    } = {};
    emailCounts?.forEach((email: any) => {
      const customerId = email.customer_id;
      const customerName = email.customers?.name || "Unknown";
      if (!customerEmailCount[customerId]) {
        customerEmailCount[customerId] = { name: customerName, count: 0 };
      }
      customerEmailCount[customerId].count += 1;
    });

    const sortedCustomers = Object.values(customerEmailCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setTopCustomers(sortedCustomers);
    setLoading(false);
  };

  const COLORS = [
    "#344256",
    "#9CA3AF",
    "#4F9DDE",
    "#F59E0B",
    "#10B981",
    "#EF4444",
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusDistribution.reduce((sum, item) => sum + item.count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{customerGrowth[customerGrowth.length - 1]?.customers || 0}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailActivity.reduce((sum, item) => sum + item.emails, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusDistribution.find((s) => s.status === "Lead")?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emailActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="emails" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  label={({ percent }) =>
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload.status,
                  ]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: "#374151", fontSize: "14px" }}>
                      {entry.payload.status}
                    </span>
                  )}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customers by Communication</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
