import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useApp } from '../context/AppContext';

export function RoadmapScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { roadmap } = state;

  if (!roadmap) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Roadmap Yet</Text>
          <Text style={styles.emptyText}>
            Complete the assessment to generate your personalized study plan
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('DecisionTree')}
          >
            <Text style={styles.emptyButtonText}>Start Assessment</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { weeklySchedule, modules, deadline, pathName, totalHours } = roadmap;

  const handleMarkComplete = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const newStatus = module.status === 'done' ? 'pending' : 'done';

    dispatch({
      type: 'UPDATE_MODULE_PROGRESS',
      moduleId,
      progress: { status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : null }
    });

    Alert.alert(
      'Success',
      newStatus === 'done'
        ? `Marked "${module.name}" as complete!`
        : `Marked "${module.name}" as pending`
    );
  };

  const handleStartModule = (moduleId) => {
    dispatch({
      type: 'UPDATE_MODULE_PROGRESS',
      moduleId,
      progress: { status: 'in-progress', startedAt: new Date().toISOString() }
    });
  };

  const overallProgress = useMemo(() => {
    if (modules.length === 0) return 0;
    const completed = modules.filter(m => m.status === 'done').length;
    return (completed / modules.length) * 100;
  }, [modules]);

  const renderWeeklySchedule = () => {
    return weeklySchedule.slice(0, 8).map((week) => {
      const weekModules = modules.filter(m =>
        week.moduleIds.includes(m.id)
      );

      if (weekModules.length === 0) return null;

      return (
        <View key={week.week} style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>Week {week.week}</Text>
            <Text style={styles.weekHours}>{week.hoursAllocated.toFixed(1)}h</Text>
          </View>

          {weekModules.map((module) => (
            <View key={module.id} style={styles.moduleItem}>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleName}>{module.name}</Text>
                <Text style={styles.moduleHours}>
                  {module.assignedHours}h • {module.startWeek}-{module.endWeek}w
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  module.status === 'done' && styles.statusDone,
                  module.status === 'in-progress' && styles.statusInProgress
                ]}
                onPress={() => {
                  if (module.status === 'pending') {
                    handleStartModule(module.id);
                  } else {
                    handleMarkComplete(module.id);
                  }
                }}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    module.status !== 'pending' && { color: '#fff' }
                  ]}
                >
                  {module.status === 'done'
                    ? '✓'
                    : module.status === 'in-progress'
                      ? '→'
                      : '○'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {week.milestones.length > 0 && (
            <View style={styles.milestones}>
              {week.milestones.map((milestone, idx) => (
                <Text key={idx} style={styles.milestone}>
                  📍 {milestone}
                </Text>
              ))}
            </View>
          )}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Study Plan</Text>
          <Text style={styles.subtitle}>{pathName}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(overallProgress)}%</Text>
            <Text style={styles.statLabel}>Overall Progress</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${overallProgress}%` }
                ]}
              />
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard2}>
              <Text style={styles.stat2Value}>{modules.length}</Text>
              <Text style={styles.stat2Label}>Modules</Text>
            </View>
            <View style={styles.statCard2}>
              <Text style={styles.stat2Value}>{totalHours}h</Text>
              <Text style={styles.stat2Label}>Total Hours</Text>
            </View>
            <View style={styles.statCard2}>
              <Text style={styles.stat2Value}>{deadline}</Text>
              <Text style={styles.stat2Label}>Deadline</Text>
            </View>
          </View>
        </View>

        <View style={styles.scheduleSectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <Text style={styles.sectionSubtitle}>Next 8 weeks</Text>
        </View>

        <View style={styles.schedule}>
          {renderWeeklySchedule()}
        </View>

        <View style={styles.allModulesSection}>
          <Text style={styles.sectionTitle}>All Modules</Text>
          {modules.map((module) => (
            <View key={module.id} style={styles.allModuleItem}>
              <View style={styles.moduleItemContent}>
                <Text style={styles.allModuleName}>{module.name}</Text>
                <Text style={styles.allModuleDesc}>{module.description}</Text>
                <Text style={styles.allModuleStats}>
                  {module.assignedHours}h • Week {module.startWeek}-{module.endWeek}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.moduleStatusButton,
                  module.status === 'done' && styles.moduleStatusDone,
                  module.status === 'in-progress' && styles.moduleStatusInProgress
                ]}
                onPress={() => handleMarkComplete(module.id)}
              >
                <Text style={styles.moduleStatusText}>
                  {module.status === 'done' ? '✓' : module.status === 'in-progress' ? '→' : '○'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
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
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard2: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stat2Value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stat2Label: {
    fontSize: 12,
    color: '#666',
  },
  scheduleSectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  schedule: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  weekCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  weekHours: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  moduleHours: {
    fontSize: 12,
    color: '#666',
  },
  statusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDone: {
    backgroundColor: '#34C759',
  },
  statusInProgress: {
    backgroundColor: '#FF9500',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  milestones: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff3cd',
  },
  milestone: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  allModulesSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  allModuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  moduleItemContent: {
    flex: 1,
  },
  allModuleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  allModuleDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  allModuleStats: {
    fontSize: 11,
    color: '#999',
  },
  moduleStatusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleStatusDone: {
    backgroundColor: '#34C759',
  },
  moduleStatusInProgress: {
    backgroundColor: '#FF9500',
  },
  moduleStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
