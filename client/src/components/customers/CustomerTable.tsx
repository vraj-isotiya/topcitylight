import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface CustomerTableProps {
  customers: any[];
  onSelectCustomer: (customer: any) => void;
  onEditCustomer: (customer: any) => void;
  loading: boolean;
}

export const CustomerTable = ({
  customers,
  onSelectCustomer,
  onEditCustomer,
  loading,
}: CustomerTableProps) => {
  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Loading customers...
        </p>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No customers found</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectCustomer(customer)}
            >
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.company}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    customer.status === "Customer" ? "default" : "secondary"
                  }
                >
                  {customer.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCustomer(customer);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
