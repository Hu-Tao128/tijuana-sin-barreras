import functions from '@react-native-firebase/functions';
import type { BarrierType, Report, Comment } from './types';

function call<TReq = Record<string, unknown>, TRes = unknown>(
  name: string,
) {
  return async (data: TReq): Promise<TRes> => {
    const fn = functions().httpsCallable(name, { timeout: 120000 });
    const result = await fn(data);
    return result.data as TRes;
  };
}

export interface CreateReportParams {
  type: BarrierType;
  latitude: number;
  longitude: number;
  severity?: number;
  description?: string;
  photoUrl?: string;
  reporterMobilityProfile?: string;
}

export interface CreateReportResult {
  success: boolean;
  report: Report;
}

export const createReport = call<CreateReportParams, CreateReportResult>(
  'createReport',
);

export interface ConfirmReportResult {
  success: boolean;
}

export const confirmReport = call<{ reportId: string }, ConfirmReportResult>(
  'confirmReport',
);

export const rejectReport = call<{ reportId: string }, ConfirmReportResult>(
  'rejectReport',
);

export interface GetReportsInAreaParams {
  north: number;
  south: number;
  east: number;
  west: number;
  status?: string;
}

export interface GetReportsInAreaResult {
  success: boolean;
  reports: Report[];
}

export const getReportsInArea = call<
  GetReportsInAreaParams,
  GetReportsInAreaResult
>('getReportsInArea');

export interface GetMyReportsResult {
  success: boolean;
  reports: Report[];
}

export const getMyReports = call<void, GetMyReportsResult>('getMyReports');

export interface DeleteMyReportResult {
  success: boolean;
}

export const deleteMyReport = call<
  { reportId: string },
  DeleteMyReportResult
>('deleteMyReport');

export interface AddCommentParams {
  reportId: string;
  text: string;
}

export interface AddCommentResult {
  success: boolean;
  comment: Comment;
}

export const addComment = call<AddCommentParams, AddCommentResult>(
  'addComment',
);

export interface GetReportCommentsResult {
  success: boolean;
  comments: Comment[];
}

export const getReportComments = call<
  { reportId: string },
  GetReportCommentsResult
>('getReportComments');

export interface RegisterUserProfileParams {
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  edad?: number;
  mobilityProfile?: string;
  maxWalkingMeters?: number;
  canClimbStairs?: boolean;
  maxStairSteps?: number;
  visionProfile?: string;
  transportModes?: string[];
  needsLowNoise?: boolean;
  emergencyContact?: { name: string; phone: string };
  preferredLanguage?: string;
}

export const registerUserProfile = call<
  RegisterUserProfileParams,
  { success: boolean }
>('registerUserProfile');

export interface GetCurrentUserProfileResult {
  success: boolean;
  user: {
    uid: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
    phoneNumber?: string;
    role?: string;
    isActive?: boolean;
    edad?: number;
    mobilityProfile?: string;
    maxWalkingMeters?: number;
    canClimbStairs?: boolean;
    maxStairSteps?: number;
    visionProfile?: string;
    transportModes?: string[];
    needsLowNoise?: boolean;
    emergencyContact?: { name: string; phone: string };
    preferredLanguage?: string;
    reportCount?: number;
    verifiedReportCount?: number;
    createdAt?: number;
    lastLoginAt?: number;
    fromFirestore?: boolean;
  };
}

export const getCurrentUserProfile =
  call<void, GetCurrentUserProfileResult>('getCurrentUserProfile');

export interface GenerateAccessibleRouteParams {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  mobilityProfileOverride?: string;
}

export interface RouteWarning {
  reportId: string;
  type: string;
  severity: number;
  description?: string;
  lat: number;
  lng: number;
}

export interface GenerateAccessibleRouteResult {
  success: boolean;
  route: {
    polyline: string;
    distanceMeters: number;
    durationSeconds: number;
    warningsOnRoute: RouteWarning[];
    barriersInCorridor: number;
    barriersAvoided: number;
    accessibilityScore: number;
    maxWalkingExceeded: boolean;
  };
}

export const generateAccessibleRoute = call<
  GenerateAccessibleRouteParams,
  GenerateAccessibleRouteResult
>('generateAccessibleRoute');
