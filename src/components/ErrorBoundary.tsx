import { Component } from 'react';
import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-slate-100 px-6 dark:bg-slate-900">
          <Text className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            Something went wrong
          </Text>
          <Text className="mb-6 text-center text-slate-600 dark:text-slate-400">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="rounded-lg bg-brand-600 px-6 py-3"
          >
            <Text className="font-semibold text-white">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
