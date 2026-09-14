import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
  CheckBiometryResult,
} from '@aparajita/capacitor-biometric-auth';
import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';

export interface BiometricLoginState {
  available: boolean;
  configured: boolean;
  label: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BiometricLoginService {
  private readonly tokenKey = 'riveraco.auth_token';
  private readonly enabledKey = 'riveraco.biometric_enabled';

  async getState(): Promise<BiometricLoginState> {
    if (!Capacitor.isNativePlatform()) {
      return {
        available: false,
        configured: false,
        label: 'Biometria',
        reason: 'Disponible solo en la app instalada',
      };
    }

    await this.prepareSecureStorage();

    const info = await this.checkBiometry();
    const configured = await this.hasSavedToken();

    return {
      available: info.isAvailable,
      configured,
      label: this.biometryLabel(info.biometryType),
      reason: info.isAvailable ? undefined : info.reason,
    };
  }

  async canEnable(): Promise<boolean> {
    const state = await this.getState();
    return state.available;
  }

  async saveToken(token: string): Promise<void> {
    await this.prepareSecureStorage();
    await SecureStorage.set(
      this.tokenKey,
      token,
      true,
      false,
      KeychainAccess.whenPasscodeSetThisDeviceOnly,
    );
    await SecureStorage.set(this.enabledKey, true);
  }

  async clearSavedLogin(): Promise<void> {
    await this.prepareSecureStorage();
    await SecureStorage.remove(this.tokenKey);
    await SecureStorage.remove(this.enabledKey);
  }

  async authenticateAndGetToken(): Promise<string | null> {
    const state = await this.getState();

    if (!state.available || !state.configured) {
      return null;
    }

    try {
      await BiometricAuth.authenticate({
        reason: 'Confirma tu identidad para entrar a RiveraCo',
        cancelTitle: 'Cancelar',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Usar codigo',
      });

      const token = await SecureStorage.get(this.tokenKey);
      return typeof token === 'string' ? token : null;
    } catch (error) {
      if (error instanceof BiometryError && error.code === BiometryErrorType.userCancel) {
        return null;
      }

      throw error;
    }
  }

  private async hasSavedToken(): Promise<boolean> {
    const enabled = await SecureStorage.get(this.enabledKey);
    const token = await SecureStorage.get(this.tokenKey);

    return enabled === true && typeof token === 'string' && token.length > 0;
  }

  private async checkBiometry(): Promise<CheckBiometryResult> {
    return BiometricAuth.checkBiometry();
  }

  private async prepareSecureStorage(): Promise<void> {
    await SecureStorage.setKeyPrefix('riveraco_');
    await SecureStorage.setSynchronize(false);
  }

  private biometryLabel(type: BiometryType): string {
    if (type === BiometryType.faceId) {
      return 'Face ID';
    }

    if (type === BiometryType.touchId) {
      return 'Touch ID';
    }

    return 'Biometria';
  }
}
