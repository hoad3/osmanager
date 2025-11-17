import { dockerConnection } from '../connection.ts';
export const dockerHubsContainer = async (
    onSuccess?: (containers: any[]) => void,
    onError?: (error: { message?: string; detail?: string; time?: string } | any) => void
): Promise<void> => {
    const connection = dockerConnection();
    const successHandler = (containers: any[]) => {
        if (onSuccess) onSuccess(containers);
    };

    const errorHandler = (err: any) => {
        if (onError) onError(err);
    };

    try {
        connection.on('GetDockerContainers', successHandler);
        connection.on('DockerErrorContainer', errorHandler);
        await connection.start();
        await connection.invoke('GetDockerContainers');
    } catch (error) {
        if (onError) onError(error);
        throw error;
    } finally {
        try {
            connection.off('GetDockerContainers', successHandler);
        } catch {}
        try {
            connection.off('DockerErrorContainer', errorHandler);
        } catch {}

        try {
            await connection.stop();
        } catch {}
    }
};

export const dockerHubsImages = async (
    onSuccess?: (containers: any[]) => void,
    onError?: (error: { message?: string; detail?: string; time?: string } | any) => void
): Promise<void> => {
    const connection = dockerConnection();
    const successHandler = (containers: any[]) => {
        if (onSuccess) onSuccess(containers);
    };

    const errorHandler = (err: any) => {
        if (onError) onError(err);
    };

    try {
        connection.on('GetDockerImages', successHandler);
        connection.on('DockerErrorImages', errorHandler);
        console.log("info hubs:", connection);

        await connection.start();
        await connection.invoke('GetDockerImages');
    } catch (error) {
        if (onError) onError(error);
        throw error;
    } finally {
        try {
            connection.off('GetDockerImages', successHandler);
        } catch {}
        try {
            connection.off('DockerErrorImages', errorHandler);
        } catch {}

        try {
            await connection.stop();
        } catch {}
    }
};