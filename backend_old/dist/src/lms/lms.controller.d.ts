import { LMSService, CreateLMSContentDto, UpdateLMSContentDto, LMSContentFilters } from './lms.service';
export declare class LMSController {
    private readonly lmsService;
    constructor(lmsService: LMSService);
    createContent(data: CreateLMSContentDto): Promise<{
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        contentType: "H5P" | "SCORM" | "FILE" | "URL" | "IFRAME" | "YOUTUBE" | "TEXT" | "VIDEO" | "AUDIO" | "IMAGE" | "QUIZ" | "ASSIGNMENT";
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";
        accessType: "FREE" | "SUBSCRIPTION" | "PREMIUM" | "TRIAL";
        subjectId: string;
        topicId?: string;
        subtopicId?: string;
        isDripContent: boolean;
        dripDelay?: number;
        dripDate?: string;
        duration?: number;
        difficulty: "EASY" | "MEDIUM" | "HARD";
        tags: string[];
        contentUrl?: string;
        fileUrl?: string;
        iframeCode?: string;
        youtubeVideoId?: string;
        textContent?: string;
        h5pContent?: string;
        scormContent?: string;
        quizQuestions?: any[];
        assignmentInstructions?: string;
        id: string;
    }>;
    getContentList(filters: LMSContentFilters): Promise<{
        content: never[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    getContent(id: string): Promise<{
        id: string;
        title: string;
        description: string;
        contentType: string;
        status: string;
        accessType: string;
        subjectId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateContent(id: string, data: UpdateLMSContentDto): Promise<{
        updatedAt: Date;
        title?: string | undefined;
        description?: string | undefined;
        contentType?: "H5P" | "SCORM" | "FILE" | "URL" | "IFRAME" | "YOUTUBE" | "TEXT" | "VIDEO" | "AUDIO" | "IMAGE" | "QUIZ" | "ASSIGNMENT" | undefined;
        status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED" | undefined;
        accessType?: "TRIAL" | "FREE" | "SUBSCRIPTION" | "PREMIUM" | undefined;
        subjectId?: string | undefined;
        topicId?: string | undefined;
        subtopicId?: string | undefined;
        isDripContent?: boolean | undefined;
        dripDelay?: number | undefined;
        dripDate?: string | undefined;
        duration?: number | undefined;
        difficulty?: "MEDIUM" | "EASY" | "HARD" | undefined;
        tags?: string[] | undefined;
        contentUrl?: string | undefined;
        fileUrl?: string | undefined;
        iframeCode?: string | undefined;
        youtubeVideoId?: string | undefined;
        textContent?: string | undefined;
        h5pContent?: string | undefined;
        scormContent?: string | undefined;
        quizQuestions?: any[] | undefined;
        assignmentInstructions?: string | undefined;
        id: string;
    }>;
    deleteContent(id: string): Promise<{
        message: string;
    }>;
    bulkDeleteContent(body: {
        contentIds: string[];
    }): Promise<{
        message: string;
    }>;
    getStats(): Promise<import("./lms.service").LMSStats>;
    uploadFile(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    getContentAnalytics(id: string): Promise<{
        content: {
            id: string;
            title: string;
        };
        progress: never[];
        stats: {
            totalEnrollments: number;
            completed: number;
            inProgress: number;
            averageProgress: number;
        };
    }>;
}
export declare class StudentLMSController {
    private readonly lmsService;
    constructor(lmsService: LMSService);
    getStudentContent(req: any, filters: LMSContentFilters): Promise<{
        content: never[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    getStudentContentById(req: any, id: string): Promise<{
        id: string;
        title: string;
        description: string;
        contentType: string;
        status: string;
        accessType: string;
        subjectId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    trackProgress(req: any, id: string, body: {
        progress: number;
    }): Promise<{
        id: string;
        userId: string;
        contentId: string;
        progress: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStudentProgress(req: any): Promise<never[]>;
}
