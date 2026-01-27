import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../store/useThemeStore.js';
import { toast } from 'react-hot-toast';
import { getTheme, updateTheme, checkServerHealth } from '../lib/api.js';

// API functions for theme management
const getThemeFromDB = async () => {
  try {
    const data = await getTheme();
    console.log('Theme API Success:', data);
    return data.theme;
  } catch (error) {
    console.error('Theme API Error:', error);
    throw error;
  }
};

const updateThemeInDB = async (theme) => {
  try {
    console.log('Sending theme to API:', theme);
    
    const data = await updateTheme(theme);
    console.log('Update Theme API Success:', data);
    return data.theme;
  } catch (error) {
    console.error('Update Theme API Error:', error);
    throw error;
  }
};

export const useTheme = () => {
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();

  // Query to get theme from database
  const { isLoading: isLoadingTheme } = useQuery({
    queryKey: ['userTheme'],
    queryFn: getThemeFromDB,
    enabled: false, // Don't auto-fetch, we'll trigger it manually
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retry
  });

  // Mutation to update theme in database
  const updateThemeMutation = useMutation({
    mutationFn: updateThemeInDB,
    onSuccess: (updatedTheme) => {
      // Update local storage and store
      setTheme(updatedTheme);
      
      // Invalidate and refetch theme
      queryClient.invalidateQueries(['userTheme']);
      
      toast.success('Theme updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating theme:', error);
      toast.error('Failed to update theme. Please try again.');
    },
  });

  // Function to change theme
  const changeTheme = async (newTheme) => {
    try {
      // Update immediately in local storage for instant feedback
      setTheme(newTheme);
      
      // Update in database
      await updateThemeMutation.mutateAsync(newTheme);
    } catch (error) {
      // Revert to previous theme if database update fails
      setTheme(theme);
      console.error('Error changing theme:', error);
      
      // Show user-friendly error message
      toast.error('Theme updated locally but failed to save to server. Please try again later.');
    }
  };

  // Function to load theme from database
  const loadThemeFromDB = async () => {
    try {
      console.log('Loading theme from database...');
      
      // First, let's test if the server is reachable
      try {
        await checkServerHealth();
        console.log('Server is reachable');
      } catch (error) {
        console.error('Server health check failed:', error.message);
        // Don't throw here, just log the error and continue
        return;
      }
      
      const dbTheme = await queryClient.fetchQuery({
        queryKey: ['userTheme'],
        queryFn: getThemeFromDB,
      });
      
      if (dbTheme && dbTheme !== theme) {
        setTheme(dbTheme);
      }
    } catch (error) {
      console.error('Error loading theme from database:', error);
      // Keep current theme if loading fails - don't show error to user
      // This is expected behavior when user is not authenticated
    }
  };

  return {
    theme,
    changeTheme,
    loadThemeFromDB,
    isLoadingTheme,
    isUpdatingTheme: updateThemeMutation.isPending,
  };
};
