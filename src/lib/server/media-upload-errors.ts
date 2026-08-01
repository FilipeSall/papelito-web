import "server-only";

import type { ImageUploadRejection } from "./image-upload";

export type MediaUploadFailure = {
  logCode: string;
  message: string;
  status: number;
};

function megabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function rejectionToFailure(rejection: ImageUploadRejection): MediaUploadFailure {
  switch (rejection.reason) {
    case "empty":
      return {
        logCode: "empty_file",
        message: "O arquivo enviado está vazio. Selecione uma imagem e tente novamente.",
        status: 422,
      };
    case "unreadable":
      return {
        logCode: "unreadable_file",
        message: "Não foi possível ler o arquivo enviado. Selecione a imagem novamente.",
        status: 422,
      };
    case "too_large":
      return {
        logCode: "too_large",
        message: `A imagem tem ${megabytes(rejection.size)} e o limite é ${megabytes(
          rejection.limit,
        )}. Reduza o tamanho e envie novamente.`,
        status: 413,
      };
    case "unknown_content":
      return {
        logCode: "unknown_content",
        message:
          "O arquivo enviado não é uma imagem reconhecida. Use WebP, PNG, JPEG, AVIF ou GIF.",
        status: 415,
      };
    case "format_not_supported":
      return {
        logCode: "format_not_supported",
        message: "Formato de imagem não suportado. Use WebP, PNG, JPEG, AVIF ou GIF.",
        status: 415,
      };
    case "content_mismatch":
      return {
        logCode: "content_mismatch",
        message:
          "O conteúdo do arquivo não corresponde à extensão informada. Salve a imagem no formato correto e envie novamente.",
        status: 415,
      };
    case "truncated":
      return {
        logCode: "truncated",
        message: "A imagem parece corrompida ou incompleta. Gere o arquivo novamente e reenvie.",
        status: 422,
      };
  }
}

const WORDPRESS_FAILURES: Record<string, MediaUploadFailure> = {
  rest_cannot_create: {
    logCode: "wp_forbidden",
    message: "Sua conta não tem permissão para enviar imagens.",
    status: 403,
  },
  rest_upload_file_too_big: {
    logCode: "wp_too_large",
    message: "A imagem excede o tamanho máximo aceito pelo servidor de mídia.",
    status: 413,
  },
  rest_upload_image_type_not_supported: {
    logCode: "wp_editor_unsupported",
    message:
      "O servidor de mídia não consegue processar este formato de imagem. Envie a imagem em PNG ou JPEG.",
    status: 415,
  },
  rest_upload_invalid_disposition: {
    logCode: "wp_invalid_disposition",
    message: "O arquivo chegou incompleto ao servidor de mídia. Tente enviar novamente.",
    status: 422,
  },
  rest_upload_no_content_disposition: {
    logCode: "wp_invalid_disposition",
    message: "O arquivo chegou incompleto ao servidor de mídia. Tente enviar novamente.",
    status: 422,
  },
  rest_upload_no_data: {
    logCode: "wp_no_data",
    message: "O arquivo chegou vazio ao servidor de mídia. Tente enviar novamente.",
    status: 422,
  },
  rest_upload_sideload_error: {
    logCode: "wp_sideload_error",
    message: "O servidor de mídia não conseguiu processar a imagem. Tente novamente.",
    status: 502,
  },
  rest_upload_unknown_error: {
    logCode: "wp_processing_error",
    message: "O servidor de mídia não conseguiu processar a imagem. Tente novamente.",
    status: 502,
  },
};

export function wordpressFailure(status: number, code: string | null): MediaUploadFailure {
  if (code && WORDPRESS_FAILURES[code]) {
    return WORDPRESS_FAILURES[code] as MediaUploadFailure;
  }

  if (status === 401 || status === 403) {
    return {
      logCode: "wp_unauthorized",
      message: "O servidor de mídia recusou a autenticação. Entre novamente e tente de novo.",
      status: 403,
    };
  }

  if (status === 413) {
    return {
      logCode: "wp_too_large",
      message: "A imagem excede o tamanho máximo aceito pelo servidor de mídia.",
      status: 413,
    };
  }

  return {
    logCode: "wp_storage_unavailable",
    message: "Não foi possível armazenar a imagem no servidor de mídia. Tente novamente.",
    status: 502,
  };
}
