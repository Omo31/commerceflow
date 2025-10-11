"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { MoreHorizontal, File, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { useFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { writeBatch, doc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import type { User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { useDebounce } from "@/hooks/use-debounce"; // A custom hook for debouncing

export default function UsersPage() {
  const { firestore, functions } = useFirestore();
  const { permissions, user } = useUser();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms delay

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const canManageUsers = permissions.users === "write";

  // Server-side search logic
  const search = useCallback(async () => {
    if (!functions) return;
    setIsLoading(true);
    setSelectedUsers([]); // Clear selections on new search

    try {
      const searchFunction = httpsCallable(functions, "searchCollection");
      const filters = statusFilter !== "all" ? { status: statusFilter } : {};

      const result = await searchFunction({
        collectionName: "users",
        searchTerm: debouncedSearchTerm,
        filters,
      });

      setSearchResults((result.data as { data: User[] }).data);
    } catch (error: any) {
      console.error("Search failed: ", error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message,
      });
      setSearchResults([]);
    }
    setIsLoading(false);
  }, [functions, debouncedSearchTerm, statusFilter, toast]);

  // Effect to trigger search when search term or filters change
  useEffect(() => {
    search();
  }, [debouncedSearchTerm, statusFilter, search]);

  const handleExportCSV = () => {
    if (searchResults.length === 0) return;
    // ... (rest of the export logic remains the same, but uses searchResults)
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? searchResults.map((u) => u.id) : []);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId),
    );
  };

  const handleBulkAction = async (action: "disable" | "enable" | "delete") => {
    if (!firestore || selectedUsers.length === 0 || !canManageUsers) return;
    const batch = writeBatch(firestore);

    selectedUsers.forEach((userId) => {
      const userRef = doc(firestore, "users", userId);
      if (action === "delete") {
        batch.delete(userRef);
      } else {
        batch.update(userRef, {
          status: action === "enable" ? "active" : "disabled",
        });
      }
    });

    try {
      await batch.commit();
      toast({
        title: `Successfully performed bulk action on ${selectedUsers.length} users.`,
      });
      await search(); // Re-run search to show updated data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Bulk action failed",
        description: error.message,
      });
    }
  };

  const isAllSelected =
    selectedUsers.length > 0 && selectedUsers.length === searchResults.length;

  return (
    <>
      <PageHeader title="Users">
        <Button onClick={handleExportCSV} disabled={searchResults.length === 0}>
          <File className="mr-2 h-4 w-4" />
          Export ({searchResults.length})
        </Button>
        <Button disabled={!canManageUsers}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Search, filter, and manage your users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={selectedUsers.length === 0 || !canManageUsers}
                >
                  Bulk Actions ({selectedUsers.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => handleBulkAction("enable")}>
                  Enable Selected
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleBulkAction("disable")}>
                  Disable Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => handleBulkAction("delete")}
                  className="text-red-500"
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Table>
            <TableHeader>{/* Table Header is unchanged */}</TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                searchResults.map((user) => (
                  <TableRow
                    key={user.id}
                    data-state={selectedUsers.includes(user.id) && "selected"}
                  >
                    {/* Table cells are unchanged */}
                  </TableRow>
                ))}
              {!isLoading && searchResults.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{searchResults.length}</strong> results.
          </div>
        </CardFooter>
      </Card>
      {userToDelete && (
        <DeleteUserDialog
          user={userToDelete}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onUserUpdate={search} // Re-run search after deletion
        />
      )}
    </>
  );
}
