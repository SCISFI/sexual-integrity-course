import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const REMINDER_TIMES = [
  { value: "06:00", label: "6:00 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
  { value: "22:00", label: "10:00 PM" },
];

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    preferences,
    loadingStatus,
    subscribe,
    unsubscribe,
    updatePreferences,
    isSubscribing,
    isUnsubscribing,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser. Try using Chrome, Edge, or Firefox for notification support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loadingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-notification-settings">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Get reminders for daily check-ins and updates from your mentor.
            </CardDescription>
          </div>
          {isSubscribed && (
            <Badge variant="outline" className="text-green-600 border-green-600" data-testid="badge-notifications-active">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === "denied" && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Notifications are blocked in your browser settings. Please allow notifications for this site to enable reminders.
            </p>
          </div>
        )}

        {!isSubscribed ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enable notifications to receive daily check-in reminders and updates when your mentor sends feedback.
            </p>
            <Button
              onClick={subscribe}
              disabled={isSubscribing || permission === "denied"}
              data-testid="button-enable-notifications"
            >
              {isSubscribing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enabling...</>
              ) : (
                <><Bell className="mr-2 h-4 w-4" />Enable Notifications</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Daily Check-in Reminder</p>
                <p className="text-xs text-muted-foreground">
                  Get reminded to complete your daily check-in
                </p>
              </div>
              <Switch
                checked={preferences?.checkinReminderEnabled ?? true}
                onCheckedChange={(checked) =>
                  updatePreferences({ checkinReminderEnabled: checked })
                }
                data-testid="switch-checkin-reminder"
              />
            </div>

            {preferences?.checkinReminderEnabled !== false && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Reminder time (UTC)</p>
                <Select
                  value={preferences?.checkinReminderTime || "20:00"}
                  onValueChange={(value) =>
                    updatePreferences({ checkinReminderTime: value })
                  }
                >
                  <SelectTrigger className="w-32" data-testid="select-reminder-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_TIMES.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Mentor Feedback Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when your mentor sends feedback
                </p>
              </div>
              <Switch
                checked={preferences?.feedbackNotificationsEnabled ?? true}
                onCheckedChange={(checked) =>
                  updatePreferences({ feedbackNotificationsEnabled: checked })
                }
                data-testid="switch-feedback-notifications"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Inactivity Encouragement Emails</p>
                <p className="text-xs text-muted-foreground">
                  Receive a supportive email if you miss check-ins for 3+ days
                </p>
              </div>
              <Switch
                checked={preferences?.nudgeEnabled ?? true}
                onCheckedChange={(checked) =>
                  updatePreferences({ nudgeEnabled: checked })
                }
                data-testid="switch-nudge-emails"
              />
            </div>

            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribe}
                disabled={isUnsubscribing}
                data-testid="button-disable-notifications"
              >
                {isUnsubscribing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Disabling...</>
                ) : (
                  <><BellOff className="mr-2 h-4 w-4" />Disable All Notifications</>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
