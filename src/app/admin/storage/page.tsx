'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserStorage {
  userId: string;
  usedBytes: number;
  limitBytes: number;
  lastUpdated: string;
  usedFormatted: string;
  limitFormatted: string;
  usagePercentage: number;
}

interface AdminStorageData {
  users: UserStorage[];
  defaultLimit: number;
  defaultLimitFormatted: string;
}

export default function AdminStoragePage() {
  const { data: session, status } = useSession();
  const [storageData, setStorageData] = useState<AdminStorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserStorage | null>(null);
  const [newLimit, setNewLimit] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchStorageData();
    }
  }, [session]);

  const fetchStorageData = async () => {
    try {
      const res = await fetch('/api/admin/storage');
      if (res.ok) {
        const data = await res.json();
        setStorageData(data);
      } else if (res.status === 403) {
        setError('Admin access required');
      } else {
        setError('Failed to load storage data');
      }
    } catch (err) {
      setError('Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (!selectedUser || !newLimit) return;
    
    const limitGB = parseFloat(newLimit);
    if (isNaN(limitGB) || limitGB <= 0) {
      alert('Please enter a valid limit');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/admin/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.userId, limitGB }),
      });

      if (res.ok) {
        setShowEditDialog(false);
        setNewLimit('');
        setSelectedUser(null);
        fetchStorageData(); // Refresh data
      } else {
        alert('Failed to update storage limit');
      }
    } catch (err) {
      alert('Failed to update storage limit');
    } finally {
      setUpdating(false);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-green-600';
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading...</div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:px-24">
        <div className="text-center pb-4">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={() => signIn('discord')}
          >
            Login with Discord
          </button>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:px-24">
        <div className="text-center pb-4">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Storage Management</h1>
          <p className="text-muted-foreground">Manage user storage limits and monitor usage</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-4">Loading storage data...</div>
          </div>
        ) : storageData ? (
          <div className="space-y-6">
            {/* Default Limit Info */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-xl font-semibold mb-2">Default Storage Limit</h2>
              <p className="text-muted-foreground">
                New users will receive {storageData.defaultLimitFormatted} of storage by default.
              </p>
            </div>

            {/* Users Table */}
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">User Storage</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4">User ID</th>
                      <th className="text-left p-4">Used</th>
                      <th className="text-left p-4">Limit</th>
                      <th className="text-left p-4">Usage</th>
                      <th className="text-left p-4">Last Updated</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageData.users.map((user) => (
                      <tr key={user.userId} className="border-t">
                        <td className="p-4 font-mono text-sm">{user.userId}</td>
                        <td className="p-4">{user.usedFormatted}</td>
                        <td className="p-4">{user.limitFormatted}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUsageBarColor(user.usagePercentage)}`}
                                style={{ width: `${Math.min(user.usagePercentage, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${getUsageColor(user.usagePercentage)}`}>
                              {user.usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(user.lastUpdated).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewLimit((user.limitBytes / (1024 * 1024 * 1024)).toString());
                                }}
                              >
                                Edit Limit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Storage Limit</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>User: {selectedUser?.userId}</Label>
                                </div>
                                <div>
                                  <Label htmlFor="new-limit">New Limit (GB)</Label>
                                  <Input
                                    id="new-limit"
                                    type="number"
                                    value={newLimit}
                                    onChange={(e) => setNewLimit(e.target.value)}
                                    placeholder="Enter limit in GB"
                                    min="0.1"
                                    step="0.1"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowEditDialog(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleUpdateLimit}
                                    disabled={updating}
                                  >
                                    {updating ? 'Updating...' : 'Update Limit'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-2xl mb-4">No storage data available</div>
          </div>
        )}
      </div>
    </main>
  );
} 