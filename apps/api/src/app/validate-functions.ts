export class ValidateFunctions {
  public static async phoneNumber(value: string): Promise<boolean> {
    if (!/^48\d{9}$/.test(value)) {
      return Promise.reject();
    }
    return true;
  }
}
