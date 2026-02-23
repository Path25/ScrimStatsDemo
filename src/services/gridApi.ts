
import { supabase } from '@/integrations/supabase/client';

// GRID API service for team verification and data fetching
export interface GridTeam {
  id: string;
  name: string;
  nameShortened: string;
  tag: string;
}

export interface GridSeries {
  id: string;
  startTimeScheduled: string;
  // Add other series properties as needed
}

export interface GridSeriesData {
  id: string;
  title: string;
  startTimeScheduled: string;
  details?: any;
  summary?: any;
  endpoints?: {
    details: string;
    summary: string;
  };
  errors?: {
    details?: string;
    summary?: string;
  };
}

class GridApiService {
  private async callEdgeFunction(body: any) {
    console.log('🚀 GridApiService: Making edge function call with body:', body);
    
    try {
      const { data, error } = await supabase.functions.invoke('grid-api', {
        body: body, // Don't stringify, let supabase handle it
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 GridApiService: Edge function response received');
      console.log('🔍 GridApiService: Full response data:', data);

      if (error) {
        console.error('❌ GridApiService: Edge function error:', error);
        throw new Error(`Function call failed: ${error.message}`);
      }

      if (!data) {
        console.error('❌ GridApiService: No data returned');
        throw new Error('No data returned from function');
      }

      if (!data.success) {
        const errorMessage = data.error || 'API call failed';
        console.error('❌ GridApiService: API call failed:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ GridApiService: Call successful');
      console.log('🔍 GridApiService: Returning data:', data);
      return data;
    } catch (error) {
      console.error('❌ GridApiService: Exception during call:', error);
      throw error;
    }
  }

  async verifyTeamByTag(teamTag: string): Promise<GridTeam | null> {
    try {
      console.log('🔍 GridApiService: Verifying team by tag:', teamTag);
      
      const data = await this.callEdgeFunction({
        teamTag,
      });

      return data.team;
    } catch (error) {
      console.error('❌ GridApiService: Error verifying team by tag:', error);
      throw error;
    }
  }

  async getTeamSeries(teamId?: string): Promise<GridSeries[]> {
    try {
      console.log('📊 GridApiService: Fetching team series for teamId:', teamId);
      
      const data = await this.callEdgeFunction({
        teamId, // Optional - edge function will use configured team ID if not provided
      });

      console.log('✅ GridApiService: Successfully fetched team series');
      return data.series || [];
    } catch (error) {
      console.error('❌ GridApiService: Error fetching team series:', error);
      throw error;
    }
  }

  async getSeriesLiveData(seriesId: string): Promise<any> {
    try {
      console.log('🎮 GridApiService: Fetching merged GRID data for seriesId:', seriesId);
      
      const data = await this.callEdgeFunction({
        seriesId: seriesId
      });

      console.log('✅ GridApiService: Successfully fetched merged GRID data');
      console.log('📊 Data structure:', {
        hasDraftData: !!data.data?.draft_data,
        hasGridMetadata: !!data.data?.grid_metadata,
        hasPostGameData: !!data.data?.post_game_data,
        participantsCount: data.data?.post_game_data?.participants?.length || 0
      });
      
      return data.data;
    } catch (error) {
      console.error('❌ GridApiService: Error fetching merged GRID data:', error);
      throw error;
    }
  }
}

export const gridApi = new GridApiService();
