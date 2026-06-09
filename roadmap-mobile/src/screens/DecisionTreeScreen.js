import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { generateRoadmap } from '../utils/roadmapGenerator';
import moduleData from '../data/MODULE_DATA.json';

const questionIdMap = {
  q1: 'techLevel',
  q2: 'targetCompanyType',
  q3: 'hoursPerWeek',
  q4: 'hasExistingProject',
  q5: 'timeline'
};

export function DecisionTreeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const questions = moduleData.decision_tree;
  const currentQuestion = questions[state.currentStep];
  const answerKey = questionIdMap[currentQuestion.question_id];
  const [generating, setGenerating] = React.useState(false);

  const progress = useMemo(() => {
    return ((state.currentStep + 1) / questions.length) * 100;
  }, [state.currentStep, questions.length]);

  const handleOptionChange = (value) => {
    dispatch({ type: 'SET_ANSWER', key: answerKey, value });
  };

  const handleNext = async () => {
    const answer = state.answers[answerKey];
    if (!answer) return;

    if (state.currentStep < questions.length - 1) {
      dispatch({ type: 'NEXT_STEP' });
    } else {
      // Generate roadmap
      setGenerating(true);
      try {
        const roadmap = generateRoadmap(state.answers);
        dispatch({ type: 'COMPLETE_ASSESSMENT', roadmap });
        navigation.replace('MainApp', { screen: 'Roadmap' });
      } catch (error) {
        console.error('Error generating roadmap:', error);
      } finally {
        setGenerating(false);
      }
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'PREV_STEP' });
    }
  };

  const isAnswered = !!state.answers[answerKey];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressLabels}>
          <Text style={styles.stepText}>
            Step {state.currentStep + 1} of {questions.length}
          </Text>
          <Text style={styles.percentText}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` }
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>CS Interview Roadmap</Text>
          <Text style={styles.appSubtitle}>
            Answer 5 questions to get your personalized study plan
          </Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  isAnswered && state.answers[answerKey] === option.value
                    ? styles.optionCardSelected
                    : styles.optionCardUnselected
                ]}
                onPress={() => handleOptionChange(option.value)}
              >
                <View style={styles.optionRadio}>
                  {state.answers[answerKey] === option.value && (
                    <View style={styles.optionRadioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    state.answers[answerKey] === option.value
                      ? styles.optionLabelSelected
                      : {}
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintText}>
              💡 This affects: {currentQuestion.impact.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleBack}
          disabled={state.currentStep === 0}
        >
          <Text style={styles.secondaryButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            !isAnswered && styles.disabledButton,
            generating && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!isAnswered || generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {state.currentStep === questions.length - 1
                ? 'Generate Roadmap'
                : 'Next →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
  },
  optionCardSelected: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  optionCardUnselected: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  optionLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  hint: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
