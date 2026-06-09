import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

export function ProgressScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { roadmap } = state;

  if (!roadmap) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Roadmap Yet</Text>
          <Text style={styles.emptyText}>
            Start the assessment to track your progress
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { modules, weeklySchedule } = roadmap;

  const stats = useMemo(() => {
    const completed = modules.filter(m => m.status === 'done').length;
    const inProgress = modules.filter(m => m.status === 'in-progress').length;
    const pending = modules.filter(m => m.status === 'pending').length;
    const overallProgress = (completed / modules.length) * 100;

    // Current week
    const today = new Date();
    const weekNumber = Math.ceil(
      (today.getTime() - new Date(roadmap.generatedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    return {
      completed,
      inProgress,
      pending,
      overallProgress,
      currentWeek: Math.max(1, Math.min(weekNumber, weeklySchedule.length))
    };
  }, [modules, weeklySchedule, roadmap.generatedAt]);

  const currentWeekData = weeklySchedule[stats.currentWeek - 1];
  const currentWeekModules = modules.filter(m =>
    currentWeekData?.moduleIds.includes(m.id)
  );

  const handleClearProgress = () => {
    Alert.alert(
      'Clear Progress?',
      'This will reset all your module progress. You can still see your roadmap.',
      [
        { text: 'Cancel', onPress: () => { }, style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            modules.forEach(m => {
              dispatch({
                type: 'UPDATE_MODULE_PROGRESS',
                moduleId: m.id,
                progress: { status: 'pending' }
              });
            });
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <TouchableOpacity
            style={styles.notificationBell}
            onPress={() => {
              Alert.alert(
                'Notifications',
                'You have no new notifications. Keep grinding! 💪'
              );
            }}
          >
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.overallProgressCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercent}>{Math.round(stats.overallProgress)}%</Text>
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressSubtitle}>
              {stats.completed} of {modules.length} modules completed
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.overallProgress}%` }
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>
              {stats.inProgress}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#999' }]}>
              {stats.pending}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week (Week {stats.currentWeek})</Text>

          {currentWeekModules.length > 0 ? (
            <View style={styles.weekModulesList}>
              {currentWeekModules.map((module) => (
                <View
                  key={module.id}
                  style={[
                    styles.weekModuleCard,
                    module.status === 'done' && styles.moduleCardDone
                  ]}
                >
                  <View style={styles.weekModuleLeft}>
                    <Text style={styles.weekModuleName}>{module.name}</Text>
                    <Text style={styles.weekModuleHours}>
                      {module.assignedHours} hours
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusIndicator,
                      module.status === 'done' && styles.statusDone,
                      module.status === 'in-progress' && styles.statusInProgress,
                      module.status === 'pending' && styles.statusPending
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {module.status === 'done' ? '✓' : module.status === 'in-progress' ? '→' : '○'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noModulesCard}>
              <Text style={styles.noModulesText}>
                No modules scheduled for this week. Great progress! 🎉
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              📈 You've completed {stats.completed} module{stats.completed !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.activitySubtext}>
              Keep up the pace to stay on schedule!
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Roadmap')}
          >
            <Text style={styles.actionButtonText}>View Full Roadmap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearProgress}
          >
            <Text style={styles.dangerButtonText}>Reset Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  notificationBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  overallProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  weekModulesList: {
    gap: 8,
  },
  weekModuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  moduleCardDone: {
    backgroundColor: '#f0fff4',
  },
  weekModuleLeft: {
    flex: 1,
  },
  weekModuleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  weekModuleHours: {
    fontSize: 12,
    color: '#666',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPending: {
    backgroundColor: '#e0e0e0',
  },
  statusInProgress: {
    backgroundColor: '#FF9500',
  },
  statusDone: {
    backgroundColor: '#34C759',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  noModulesCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  noModulesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dangerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3b30',
  },
});
