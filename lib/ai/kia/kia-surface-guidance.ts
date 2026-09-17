import type { KiaAvatarState } from './kia-avatar-state';

export interface KiaSurfaceGuidance {
  state: KiaAvatarState;
  title: string;
  message: string;
  detail?: string;
}

export function resolveCaseListGuidance(activeCount: number, closedCount: number): KiaSurfaceGuidance {
  if (activeCount > 0) {
    return {
      state: 'seguimiento',
      title: activeCount === 1 ? 'Tienes 1 expediente activo' : `Tienes ${activeCount} expedientes activos`,
      message: 'Puedes abrir cada expediente para revisar su estado, documentación pendiente y nuevas comunicaciones.',
    };
  }

  if (closedCount > 0) {
    return {
      state: 'exito',
      title: 'Tus expedientes visibles están finalizados',
      message: 'Puedes consultar el histórico cuando lo necesites o contratar un nuevo servicio desde tu panel.',
    };
  }

  return {
    state: 'ayuda',
    title: 'Estoy aquí para ayudarte con tus expedientes',
    message: 'Cuando contrates un servicio, podrás seguir aquí su estado, documentación y mensajes.',
  };
}

export function resolveCaseDetailGuidance(input: {
  caseState: string;
  checklistCount: number;
  uploadedCount: number;
  reviewedCount: number;
}): KiaSurfaceGuidance {
  const detail = input.uploadedCount > 0
    ? `${input.uploadedCount} documento${input.uploadedCount === 1 ? '' : 's'} subido${input.uploadedCount === 1 ? '' : 's'}${input.reviewedCount > 0 ? ` · ${input.reviewedCount} revisado${input.reviewedCount === 1 ? '' : 's'}` : ''}`
    : undefined;

  switch (input.caseState) {
    case 'nuevo':
      return {
        state: 'ayuda',
        title: 'Tu expediente ya está abierto',
        message: 'Estamos preparando el siguiente paso. Te avisaremos si necesitamos documentación o alguna confirmación.',
      };
    case 'docs_pendientes':
    case 'pendiente_documentacion': {
      const missingUploads = input.checklistCount > 0 && input.uploadedCount < input.checklistCount;
      return {
        state: missingUploads ? 'aviso' : 'duda',
        title: missingUploads ? 'Necesitamos documentación para continuar' : 'Revisa la documentación solicitada',
        message: missingUploads
          ? 'Sube los documentos pendientes indicados en este expediente. Si alguno no aplica, utiliza el hilo de mensajes para confirmarlo con el equipo.'
          : 'Ya hay documentación subida, pero el expediente sigue marcado como pendiente. Revisa el listado y consulta cualquier duda antes de añadir más archivos.',
        detail,
      };
    }
    case 'docs_recibidos':
    case 'en_revision':
      return {
        state: 'seguimiento',
        title: 'La documentación está en revisión',
        message: 'No necesitas hacer nada más por ahora salvo que el equipo te solicite información adicional.',
        detail,
      };
    case 'en_tramitacion':
    case 'en_proceso':
      return {
        state: 'seguimiento',
        title: 'Tu trámite está en curso',
        message: 'El expediente está avanzando. Puedes seguir aquí los próximos hitos y comunicaciones.',
        detail,
      };
    case 'pendiente_externo':
      return {
        state: 'seguimiento',
        title: 'Estamos esperando una respuesta externa',
        message: 'El siguiente avance depende de un organismo, proveedor o tercero. Te avisaremos cuando cambie el estado.',
        detail,
      };
    case 'resolucion_recibida':
      return {
        state: 'confianza',
        title: 'Ya hemos recibido la resolución',
        message: 'El expediente ha alcanzado este hito confirmado. El equipo está preparando la revisión final y la entrega correspondiente.',
        detail,
      };
    case 'presentado':
      return {
        state: 'confianza',
        title: 'El trámite consta como presentado',
        message: 'La presentación ya está confirmada en el expediente. Seguimos el siguiente hito sin anticipar todavía el resultado final.',
        detail,
      };
    case 'entregado':
      return {
        state: 'exito',
        title: 'El servicio ya está entregado',
        message: 'Revisa los documentos finales y utiliza el hilo de mensajes si necesitas una aclaración.',
        detail,
      };
    case 'finalizado':
      return {
        state: 'exito',
        title: 'El expediente está finalizado',
        message: 'Puedes consultar aquí el histórico, los documentos y las comunicaciones asociadas al servicio.',
        detail,
      };
    default:
      return {
        state: 'seguimiento',
        title: 'Estoy siguiendo este expediente contigo',
        message: 'El estado procede del expediente autorizado. Consulta la guía de la pantalla para ver el siguiente paso operativo.',
        detail,
      };
  }
}

export type KiaHoldedConnectionPhase =
  | 'idle'
  | 'testing'
  | 'verified'
  | 'connecting'
  | 'disconnecting'
  | 'error';

export function resolveHoldedIntegrationGuidance(input: {
  integrationStatus: string | null;
  phase: KiaHoldedConnectionPhase;
  hasUiError: boolean;
}): KiaSurfaceGuidance {
  if (input.hasUiError || input.phase === 'error' || input.integrationStatus === 'failed') {
    return {
      state: 'aviso',
      title: 'Hay que revisar la conexión con Holded',
      message: 'Comprueba el aviso de la integración antes de continuar. KIA no asumirá que la conexión está disponible mientras exista este error.',
    };
  }

  if (
    input.phase === 'testing' ||
    input.phase === 'connecting' ||
    input.phase === 'disconnecting' ||
    input.integrationStatus === 'pending'
  ) {
    return {
      state: 'pensando',
      title: input.phase === 'disconnecting' ? 'Estoy actualizando la conexión' : 'Estoy verificando la integración',
      message: 'Mantengo el estado visual en curso hasta que la operación confirme su resultado. No anticipo una conexión válida antes de tiempo.',
    };
  }

  if (input.integrationStatus === 'active') {
    return {
      state: 'confianza',
      title: 'Holded está conectado',
      message: 'La integración figura activa en EXPERT. Puedes consultar debajo los permisos detectados y el modo de sincronización disponible.',
    };
  }

  if (input.phase === 'verified') {
    return {
      state: 'confianza',
      title: 'La conexión con Holded está verificada',
      message: 'La credencial ha superado la comprobación. Revisa los permisos y el consentimiento antes de completar la conexión.',
    };
  }

  if (input.integrationStatus === 'disabled' || input.integrationStatus === 'revoked') {
    return {
      state: 'ayuda',
      title: 'Holded no está activo ahora mismo',
      message: 'Puedes volver a conectar la integración cuando lo necesites. KIA no tratará esta cuenta como disponible mientras permanezca desactivada.',
    };
  }

  return {
    state: 'ayuda',
    title: 'Te ayudo a conectar Holded',
    message: 'Empieza verificando tu API Token. La conexión solo se considerará válida cuando el sistema confirme la verificación y el alta de la integración.',
  };
}

export function resolveProfileGuidance(input: {
  saving: boolean;
  hasError: boolean;
  hasRecentSuccess: boolean;
  profileCompleted: boolean;
  billingReady: boolean;
  habitualAddressReady: boolean;
  isCompany: boolean;
}): KiaSurfaceGuidance {
  if (input.hasError) {
    return {
      state: 'aviso',
      title: 'Necesito que revises el aviso del formulario',
      message: 'Alguna operación del perfil no se ha completado. Corrige el dato indicado y vuelve a intentarlo antes de continuar.',
    };
  }

  if (input.saving) {
    return {
      state: 'pensando',
      title: 'Estoy guardando tus cambios',
      message: 'Mantengo el formulario en curso hasta recibir confirmación. No doy por actualizados los datos antes de tiempo.',
    };
  }

  if (!input.billingReady) {
    return {
      state: 'ayuda',
      title: 'Completa los datos de facturación',
      message: 'EXPERT necesita estos datos antes de contratar servicios o suscripciones. KIA solo utiliza el indicador de preparación, no interpreta el contenido de los campos.',
    };
  }

  if (!input.isCompany && !input.habitualAddressReady) {
    return {
      state: 'explicacion',
      title: 'Falta completar el domicilio habitual',
      message: 'Para una persona física este bloque puede ser necesario en trámites fiscales o de extranjería. Completa la sección indicada antes de dar el perfil por preparado.',
    };
  }

  if (!input.profileCompleted) {
    return {
      state: 'ayuda',
      title: 'Revisa los datos básicos del perfil',
      message: 'Los datos fiscales ya están preparados, pero el perfil todavía no figura como completo. Revisa las secciones pendientes que muestra esta pantalla.',
    };
  }

  if (input.hasRecentSuccess) {
    return {
      state: 'exito',
      title: 'Los cambios se han guardado correctamente',
      message: 'La operación ha sido confirmada por la propia pantalla. Puedes seguir editando o volver al panel cuando lo necesites.',
    };
  }

  return {
    state: 'confianza',
    title: 'Tu perfil está preparado',
    message: 'Los indicadores actuales confirman que el perfil y los datos necesarios están completos para continuar con los servicios compatibles.',
  };
}

export type KiaOnboardingStep = 'profile' | 'company' | 'done';

export function resolveOnboardingGuidance(input: {
  step: KiaOnboardingStep;
  loading: boolean;
  hasError: boolean;
  companySkipped: boolean;
}): KiaSurfaceGuidance {
  if (input.hasError) {
    return {
      state: 'aviso',
      title: 'Necesito que revises un dato',
      message: 'Comprueba el aviso del formulario. No avanzaré hasta que el dato requerido quede correctamente informado.',
    };
  }

  if (input.loading) {
    return {
      state: 'pensando',
      title: 'Estoy guardando la información',
      message: 'Un momento. Mantengo tus datos y el siguiente paso separados para evitar avanzar con una operación incompleta.',
    };
  }

  if (input.step === 'done') {
    return {
      state: 'exito',
      title: 'Configuración inicial completada',
      message: input.companySkipped
        ? 'Tu perfil está listo. Podrás añadir la entidad fiscal más adelante antes de contratar una suscripción mensual.'
        : 'Tu perfil y tu entidad están preparados. El siguiente paso será contratar el servicio o plan que necesites.',
    };
  }

  if (input.step === 'company') {
    if (input.companySkipped) {
      return {
        state: 'duda',
        title: 'Puedes continuar sin añadir la entidad ahora',
        message: 'Ten en cuenta que necesitarás una entidad fiscal antes de contratar una suscripción mensual. Puedes volver y añadirla en este paso.',
      };
    }

    return {
      state: 'explicacion',
      title: 'Ahora identificamos la entidad fiscal',
      message: 'Estos datos permiten separar correctamente cada empresa y mantener sus expedientes, facturación e integraciones en su propio ámbito.',
    };
  }

  return {
    state: 'bienvenida',
    title: 'Te acompaño en la configuración inicial',
    message: 'Empezamos por tus datos básicos. Después podrás añadir la entidad fiscal que utilizarás en EXPERT.',
  };
}
